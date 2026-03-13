"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import type { UIMessage } from "ai";
import { useChatContext } from "@/lib/chat-context";
import {
  useCreateThread,
  useThreads,
  useUpdateThreadModel,
} from "@/hooks/use-threads";
import { useGenerateTitle } from "@/hooks/use-generate-title";
import { useUsage } from "@/hooks/use-usage";
import {
  fetchMessages,
  saveMessagesAction,
  deleteThreadAction,
  ensureThreadExists,
} from "@/lib/thread-actions";
import {
  getCachedMessages,
  setCachedMessages,
  clearCachedMessages,
  prefetchMessages,
} from "@/lib/message-cache";

// ── Durable pending-send ────────────────────────────────────────────
// Persisted to localStorage *synchronously* before any async work so
// the user's intent survives an immediate page refresh.

const PENDING_SEND_KEY = "c3chat-pending-send";

interface PendingSend {
  threadId: string;
  text: string;
  model: string;
  ts: number;
}

function getPendingSend(threadId: string): PendingSend | null {
  try {
    const raw = localStorage.getItem(PENDING_SEND_KEY);
    if (!raw) return null;
    const send: PendingSend = JSON.parse(raw);
    if (send.threadId !== threadId) return null;
    // Expire after 5 minutes
    if (Date.now() - send.ts > 5 * 60_000) {
      localStorage.removeItem(PENDING_SEND_KEY);
      return null;
    }
    return send;
  } catch {
    localStorage.removeItem(PENDING_SEND_KEY);
    return null;
  }
}

function setPendingSend(send: PendingSend): void {
  try {
    localStorage.setItem(PENDING_SEND_KEY, JSON.stringify(send));
  } catch {
    // localStorage unavailable — best-effort
  }
}

function clearPendingSend(): void {
  try {
    localStorage.removeItem(PENDING_SEND_KEY);
  } catch {}
}

// ── Hook ────────────────────────────────────────────────────────────

export function useChatController() {
  const {
    activeChatId,
    setActiveChatId,
    selectedModel,
    setSelectedModel,
    hydrated,
    visitorId,
  } = useChatContext();

  const queryClient = useQueryClient();
  const { data: usage } = useUsage();
  const canSend = usage?.canSend !== false;

  const createThread = useCreateThread();
  const generateTitle = useGenerateTitle();
  const { data: threads } = useThreads();
  const updateThreadModel = useUpdateThreadModel();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep a ref to threads so we can read the latest value inside effects
  // without adding it as a dependency
  const threadsRef = useRef(threads);
  threadsRef.current = threads;

  // Pending message to send after useChat re-renders with the new thread ID
  const pendingMessageRef = useRef<{
    text: string;
    model: string;
  } | null>(null);

  // Promise that resolves once the thread row exists in the DB
  const threadReadyRef = useRef<Promise<unknown> | null>(null);

  const { messages, status, sendMessage, setMessages } = useChat({
    id: activeChatId ?? undefined,
  });

  // Focus the textarea on chat switch and after each response completes
  useEffect(() => {
    const id = requestAnimationFrame(() => textareaRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [activeChatId, status]);

  // ── Restore / load messages when activeChatId changes ─────────────
  // useLayoutEffect ensures setMessages runs BEFORE the browser paints,
  // so the user never sees a blank frame during restore.
  useLayoutEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    // Restore the thread's model from the cached thread list
    const thread = threadsRef.current?.find((t) => t.id === activeChatId);
    if (thread) {
      setSelectedModel(thread.model);
    }

    // 1. Normal in-session send (pendingMessageRef set by startNewChat)
    if (pendingMessageRef.current) {
      const { text, model } = pendingMessageRef.current;
      pendingMessageRef.current = null;
      sendMessage({ text }, { body: { model, fingerprintId: visitorId } });
      return;
    }

    // 2. Durable re-send after page refresh (pendingSend in localStorage)
    //    LOCAL-FIRST: show the user's message immediately from localStorage
    //    so the UI never shows a blank/stuck state, then re-send in background.
    //    IMPORTANT: do NOT clearPendingSend here — it survives until the
    //    response fully completes and is saved to DB. This makes multiple
    //    rapid refreshes safe: each one re-enters this path and retries.
    const pending = getPendingSend(activeChatId);
    if (pending) {
      // ── SYNC: display user's message instantly (no blank screen) ──
      const pendingMsgId = `pending-${activeChatId}`;
      const syntheticUserMsg: UIMessage = {
        id: pendingMsgId,
        role: "user",
        parts: [{ type: "text", text: pending.text }],
      };
      setMessages([syntheticUserMsg]);

      // ── ASYNC: set up thread, load history, then trigger AI response ──
      const restore = async () => {
        // Load any existing history (for follow-up messages on existing chats)
        const msgs = await fetchMessages(activeChatId);
        let msgIdToReplace = pendingMsgId;

        if (msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg.role === "user") {
            // User message was eagerly saved before refresh — use its ID
            msgIdToReplace = lastMsg.id;
            setMessages(msgs);
          } else {
            // Previous conversation is complete; this is a follow-up message
            setMessages([...msgs, syntheticUserMsg]);
          }
          setCachedMessages(activeChatId, msgs);
        }

        // Ensure the thread row exists (might have been interrupted before
        // the original createThread completed)
        if (visitorId) {
          threadReadyRef.current = ensureThreadExists(
            activeChatId,
            pending.model,
            visitorId,
          );
          await threadReadyRef.current;
        }

        // Re-generate title (the original was likely interrupted by refresh)
        generateTitle.mutate({ prompt: pending.text, threadId: activeChatId });

        // Replace the synthetic/saved user message and trigger AI response.
        // Using messageId avoids duplicating the user message.
        sendMessage(
          { text: pending.text, messageId: msgIdToReplace },
          { body: { model: pending.model, fingerprintId: visitorId } },
        );
      };
      restore().catch(() => {});
      return;
    }

    // 3. Normal load from cache / DB
    const cached = getCachedMessages(activeChatId);
    if (cached) {
      setMessages(cached);
    } else {
      fetchMessages(activeChatId).then((msgs) => {
        if (msgs.length === 0) {
          // Guard: don't nuke a thread that was just created (< 30s ago).
          // The messages may simply not have been saved yet (race).
          const t = threadsRef.current?.find((th) => th.id === activeChatId);
          if (t && Date.now() - new Date(t.createdAt).getTime() < 30_000) {
            return;
          }

          // Orphaned empty thread — reset to new chat
          setActiveChatId(null);
          clearCachedMessages(activeChatId);
          deleteThreadAction(activeChatId).catch(() => {});
          queryClient.invalidateQueries({ queryKey: ["threads"] });
          return;
        }
        setCachedMessages(activeChatId, msgs);
        setMessages(msgs);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);

  // ── Save user message eagerly on "submitted" (belt-and-suspenders) ─
  useEffect(() => {
    if (status !== "submitted" || !activeChatId || messages.length === 0)
      return;

    const save = async () => {
      if (threadReadyRef.current) {
        try {
          await threadReadyRef.current;
        } catch {
          return;
        }
      }
      setCachedMessages(activeChatId, messages);
      await saveMessagesAction(activeChatId, messages);
    };
    save().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, activeChatId]);

  // ── Persist full conversation when streaming completes ─────────────
  useEffect(() => {
    if (status !== "ready" || !activeChatId || messages.length === 0) return;

    const save = async () => {
      if (threadReadyRef.current) {
        try {
          await threadReadyRef.current;
        } catch {
          return; // Thread creation failed, skip DB save
        }
      }
      setCachedMessages(activeChatId, messages);
      await saveMessagesAction(activeChatId, messages);

      // Only clear the durable intent AFTER the save succeeds.
      // This way, if the user refreshes before save completes,
      // the pending send survives and re-triggers the restore.
      clearPendingSend();
    };
    save().catch(() => {});

    // Safety net: if the thread still has no title (e.g. all previous
    // generateTitle calls were aborted by rapid refreshes), generate now.
    const thread = threadsRef.current?.find((t) => t.id === activeChatId);
    if (!thread?.title && messages.length > 0) {
      const firstUserMsg = messages.find((m) => m.role === "user");
      if (firstUserMsg) {
        const text = firstUserMsg.parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join(" ");
        if (text) {
          generateTitle.mutate({ prompt: text, threadId: activeChatId });
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: ["usage"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, activeChatId]);

  // Eagerly prefetch messages for recent threads so switches feel instant
  useEffect(() => {
    if (!threads) return;
    for (const thread of threads.slice(0, 8)) {
      prefetchMessages(thread.id);
    }
  }, [threads]);

  const handleModelSelect = useCallback(
    (id: string) => {
      setSelectedModel(id);
      if (activeChatId) {
        updateThreadModel.mutate({ id: activeChatId, model: id });
      }
    },
    [setSelectedModel, activeChatId, updateThreadModel]
  );

  const startNewChat = useCallback(
    (text: string) => {
      const newId = nanoid();

      // Durable: persist send intent *synchronously* before any async work
      setPendingSend({
        threadId: newId,
        text,
        model: selectedModel,
        ts: Date.now(),
      });

      pendingMessageRef.current = { text, model: selectedModel };

      threadReadyRef.current = createThread.mutateAsync({
        id: newId,
        model: selectedModel,
      });

      generateTitle.mutate({ prompt: text, threadId: newId });

      setActiveChatId(newId);
    },
    [selectedModel, setActiveChatId, createThread, generateTitle]
  );

  const isGenerating = status === "streaming" || status === "submitted";

  const handleSubmit = useCallback(
    (text: string) => {
      if (!text.trim() || !canSend || isGenerating) return;

      if (!activeChatId) {
        startNewChat(text);
      } else {
        // Durable: persist send intent for existing chat too
        setPendingSend({
          threadId: activeChatId,
          text,
          model: selectedModel,
          ts: Date.now(),
        });
        sendMessage(
          { text },
          { body: { model: selectedModel, fingerprintId: visitorId } }
        );
      }
    },
    [canSend, isGenerating, activeChatId, startNewChat, sendMessage, selectedModel, visitorId]
  );

  const activeThread = threads?.find((t) => t.id === activeChatId);

  return {
    // State
    messages,
    status,
    activeChatId,
    selectedModel,
    hydrated,
    canSend,
    isGenerating,
    threads,
    activeThread,
    textareaRef,
    // Actions
    handleSubmit,
    handleModelSelect,
  };
}
