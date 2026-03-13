"use client";

import { useCallback, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { useChatContext } from "@/lib/chat-context";
import {
  useCreateThread,
  useThreads,
  useUpdateThreadModel,
} from "@/hooks/use-threads";
import { useGenerateTitle } from "@/hooks/use-generate-title";
import { useUsage } from "@/hooks/use-usage";
import { fetchMessages, saveMessagesAction } from "@/lib/thread-actions";
import {
  getCachedMessages,
  setCachedMessages,
  prefetchMessages,
} from "@/lib/message-cache";

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

  // When activeChatId changes: either send pending message (new chat) or load from DB (existing chat)
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    // Restore the thread's model from the cached thread list
    const thread = threadsRef.current?.find((t) => t.id === activeChatId);
    if (thread) {
      setSelectedModel(thread.model);
    }

    if (pendingMessageRef.current) {
      // New chat — send the queued message now that useChat has the correct ID
      const { text, model } = pendingMessageRef.current;
      pendingMessageRef.current = null;
      sendMessage({ text }, { body: { model, fingerprintId: visitorId } });
    } else {
      // Try local cache first for instant switch
      const cached = getCachedMessages(activeChatId);
      if (cached) {
        setMessages(cached);
      } else {
        // First visit — fetch from DB, then cache
        fetchMessages(activeChatId).then((msgs) => {
          setCachedMessages(activeChatId, msgs);
          setMessages(msgs);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);

  // Persist messages after streaming completes
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
    };
    save().catch(() => {});

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
