"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
} from "@/components/ai-elements/message";
import { CitationResponse } from "@/components/citation-response";
import { MessageSources } from "@/components/message-sources";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputButton,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  CheckIcon,
  ChevronDownIcon,
  CodeIcon,
  CompassIcon,
  GlobeIcon,
  GraduationCapIcon,
  PaperclipIcon,
  SparklesIcon,
} from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { SourceUrlUIPart } from "ai";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { useChatContext } from "@/lib/chat-context";
import { CrafterStationLogo } from "@/components/logos/crafter-station";
import { GithubBadge } from "@/components/github-badge";
import {
  useCreateThread,
  useThreads,
  useUpdateThreadModel,
} from "@/hooks/use-threads";
import { useGenerateTitle } from "@/hooks/use-generate-title";
import { useUsage } from "@/hooks/use-usage";
import { UsageBanner } from "@/components/usage-banner";
import { fetchMessages, saveMessagesAction } from "@/lib/thread-actions";
import {
  getCachedMessages,
  setCachedMessages,
  prefetchMessages,
} from "@/lib/message-cache";

const models = [
  {
    chef: "OpenAI",
    chefSlug: "openai",
    id: "openai/gpt-4o",
    name: "GPT-4o",
    providers: ["openai"],
  },
  {
    chef: "OpenAI",
    chefSlug: "openai",
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    providers: ["openai"],
  },
  {
    chef: "Anthropic",
    chefSlug: "anthropic",
    id: "anthropic/claude-sonnet-4-5-20250929",
    name: "Claude Sonnet 4.5",
    providers: ["anthropic"],
  },
  {
    chef: "Anthropic",
    chefSlug: "anthropic",
    id: "anthropic/claude-opus-4-20250514",
    name: "Claude Opus 4",
    providers: ["anthropic"],
  },
  {
    chef: "Anthropic",
    chefSlug: "anthropic",
    id: "anthropic/claude-haiku-4-5-20251001",
    name: "Claude Haiku 4.5",
    providers: ["anthropic"],
  },
  {
    chef: "Google",
    chefSlug: "google",
    id: "google/gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    providers: ["google"],
  },
  {
    chef: "Google",
    chefSlug: "google",
    id: "google/gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    providers: ["google"],
  },
  {
    chef: "Meta",
    chefSlug: "llama",
    id: "groq/llama-3.3-70b",
    name: "Llama 3.3 70B",
    providers: ["groq"],
  },
  {
    chef: "DeepSeek",
    chefSlug: "deepseek",
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    providers: ["deepseek"],
  },
  {
    chef: "DeepSeek",
    chefSlug: "deepseek",
    id: "deepseek/deepseek-v3",
    name: "DeepSeek V3",
    providers: ["deepseek"],
  },
  {
    chef: "xAI",
    chefSlug: "xai",
    id: "xai/grok-3",
    name: "Grok 3",
    providers: ["xai"],
  },
  {
    chef: "Perplexity",
    chefSlug: "perplexity",
    id: "perplexity/sonar-pro",
    name: "Sonar Pro",
    providers: ["perplexity"],
  },
  {
    chef: "Mistral AI",
    chefSlug: "mistral",
    id: "mistral/mistral-large-latest",
    name: "Mistral Large",
    providers: ["mistral"],
  },
];

const categories = [
  { label: "Create", icon: SparklesIcon },
  { label: "Explore", icon: CompassIcon },
  { label: "Code", icon: CodeIcon },
  { label: "Learn", icon: GraduationCapIcon },
];

const suggestions = [
  "How does AI work?",
  "Are black holes real?",
  'How many Rs are in the word "strawberry"?',
  "What is the meaning of life?",
];

interface ModelItemProps {
  model: (typeof models)[0];
  selectedModel: string;
  onSelect: (id: string) => void;
}

const ModelItem = memo(({ model, selectedModel, onSelect }: ModelItemProps) => {
  const handleSelect = useCallback(
    () => onSelect(model.id),
    [onSelect, model.id]
  );
  return (
    <ModelSelectorItem onSelect={handleSelect} value={model.id}>
      <ModelSelectorLogo provider={model.chefSlug} />
      <ModelSelectorName>{model.name}</ModelSelectorName>
      <ModelSelectorLogoGroup>
        {model.providers.map((provider) => (
          <ModelSelectorLogo key={provider} provider={provider} />
        ))}
      </ModelSelectorLogoGroup>
      {selectedModel === model.id ? (
        <CheckIcon className="ml-auto size-4" />
      ) : (
        <div className="ml-auto size-4" />
      )}
    </ModelSelectorItem>
  );
});

ModelItem.displayName = "ModelItem";

export default function Home() {
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [text, setText] = useState("");

  const {
    activeChatId,
    setActiveChatId,
    selectedModel,
    setSelectedModel,
    startNewChat: resetToNewChat,
    hydrated,
    visitorId,
  } = useChatContext();

  const queryClient = useQueryClient();
  const { data: usage } = useUsage();
  const canSend = usage?.canSend !== false;

  // Cmd+Shift+O → new conversation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        resetToNewChat();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resetToNewChat]);

  const createThread = useCreateThread();
  const generateTitle = useGenerateTitle();
  const { data: threads } = useThreads();
  const updateThreadModel = useUpdateThreadModel();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus the textarea on every chat switch (including new chat)
  useEffect(() => {
    // Small delay to let the DOM settle after remount (Conversation key change)
    const id = requestAnimationFrame(() => textareaRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [activeChatId]);

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

  // Track pending title generation for new chats
  const pendingTitleRef = useRef<{
    prompt: string;
    threadId: string;
  } | null>(null);

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

  // Generate title and persist messages only after streaming completes
  useEffect(() => {
    if (status !== "ready" || !activeChatId || messages.length === 0) return;

    // Generate title if pending (delayed from startNewChat)
    if (pendingTitleRef.current) {
      const { prompt, threadId } = pendingTitleRef.current;
      pendingTitleRef.current = null;
      generateTitle.mutate({ prompt, threadId });
    }

    // Persist messages to DB + local cache
    const save = async () => {
      if (threadReadyRef.current) await threadReadyRef.current;
      setCachedMessages(activeChatId, messages);
      await saveMessagesAction(activeChatId, messages);
    };
    save();

    // Refresh usage count after each completed message
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
      setModelSelectorOpen(false);
      if (activeChatId) {
        updateThreadModel.mutate({ id: activeChatId, model: id });
      }
    },
    [setSelectedModel, activeChatId, updateThreadModel]
  );

  const startNewChat = useCallback(
    (text: string) => {
      const newId = nanoid();

      // Store pending message — useEffect will send it after re-render
      pendingMessageRef.current = { text, model: selectedModel };

      // Defer title generation until streaming completes
      pendingTitleRef.current = { prompt: text, threadId: newId };

      // Store promise so the save effect can await it before inserting messages
      threadReadyRef.current = createThread.mutateAsync({
        id: newId,
        model: selectedModel,
      });

      // Set ID immediately so useChat re-renders with correct ID
      setActiveChatId(newId);
    },
    [selectedModel, setActiveChatId, createThread]
  );

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text?.trim() || !canSend) return;

    if (!activeChatId) {
      startNewChat(message.text);
    } else {
      sendMessage(
        { text: message.text },
        { body: { model: selectedModel, fingerprintId: visitorId } }
      );
    }

    setText("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!canSend) return;
    if (!activeChatId) {
      startNewChat(suggestion);
    } else {
      sendMessage({ text: suggestion }, { body: { model: selectedModel, fingerprintId: visitorId } });
    }
  };

  const selectedModelData = models.find((m) => m.id === selectedModel);
  const chefs = [...new Set(models.map((m) => m.chef))];
  const hasMessages = messages.length > 0;
  const isNewChat = hydrated && !hasMessages && !activeChatId;
  const isTyping = text.length > 0;

  const activeThread = threads?.find((t) => t.id === activeChatId);

  return (
    <div className={`relative flex flex-1 flex-col overflow-hidden transition-opacity duration-300 ${hydrated ? "opacity-100" : "opacity-0"}`}>
      {/* Top gradient fade zone */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-background to-transparent sm:h-10" />

      {/* Floating sidebar trigger — top-left */}
      <div className="pointer-events-none absolute left-3 top-2.5 z-20">
        <SidebarTrigger className="pointer-events-auto rounded-md backdrop-blur-sm transition-colors hover:bg-background/80" />
      </div>

      {/* Floating thread title — top-center, desktop only */}
      {activeChatId && (
        <div className="pointer-events-none absolute inset-x-0 top-2 z-20 hidden justify-center sm:flex">
          <div className="pointer-events-auto rounded-full bg-background/60 px-4 py-1 text-sm font-medium backdrop-blur-md">
            {activeThread ? (
              activeThread.title === null ? (
                <Shimmer as="span" duration={1.5}>
                  New chat
                </Shimmer>
              ) : (
                activeThread.title
              )
            ) : (
              "C3.chat"
            )}
          </div>
        </div>
      )}

      {/* Conversation area — key forces remount on thread switch (no stale scroll) */}
      <Conversation key={activeChatId ?? "new"} initial="instant">
        <ConversationContent
          className={
            isNewChat ? "justify-center pb-40" : "pt-16 pb-40 sm:pt-12"
          }
        >
          {isNewChat ? (
            /* Empty state — fades out on first keystroke */
            <div
              className={`flex flex-col items-center px-4 transition-all duration-300 ease-out ${
                isTyping
                  ? "pointer-events-none -translate-y-4 scale-[0.98] opacity-0"
                  : "translate-y-0 scale-100 opacity-100"
              }`}
            >
              <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">
                How can I help you?
              </h1>

              {/* Category pills */}
              <div className="mb-8 flex flex-wrap justify-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.label}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    <cat.icon className="size-3.5" />
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Suggestion questions */}
              <div className="w-full max-w-lg">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`flex w-full items-center py-3.5 text-left text-sm text-muted-foreground transition-colors hover:text-foreground ${
                      i < suggestions.length - 1
                        ? "border-b border-border"
                        : ""
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {/* Crafter Station + GitHub */}
              <div className="mt-8 flex items-center gap-3">
                <a
                  href="https://crafterstation.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-muted-foreground/40 transition-colors hover:text-muted-foreground"
                >
                  <CrafterStationLogo className="size-3.5" />
                  <span className="text-xs">Crafter Station</span>
                </a>
                <span className="text-muted-foreground/20">|</span>
                <GithubBadge />
              </div>
            </div>
          ) : (
            /* Messages */
            messages.map((message, messageIndex) => {
              const isLastMessage = messageIndex === messages.length - 1;
              const isStreaming =
                isLastMessage &&
                (status === "streaming" || status === "submitted");

              const sources: SourceUrlUIPart[] = message.parts.filter(
                (p): p is SourceUrlUIPart => p.type === "source-url",
              );

              return (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case "reasoning":
                          if (part.state === "done" && !part.text.length)
                            return null;
                          return (
                            <Reasoning
                              key={`${message.id}-${i}`}
                              isStreaming={part.state === "streaming"}
                            >
                              <ReasoningTrigger />
                              <ReasoningContent>{part.text}</ReasoningContent>
                            </Reasoning>
                          );
                        case "text":
                          return (
                            <CitationResponse
                              key={`${message.id}-${i}`}
                              mode={isStreaming ? "streaming" : "static"}
                              sources={sources}
                            >
                              {part.text}
                            </CitationResponse>
                          );
                        default:
                          return null;
                      }
                    })}
                    <MessageSources sources={sources} />
                  </MessageContent>
                </Message>
              );
            })
          )}
        </ConversationContent>
        <ConversationScrollButton className="bottom-36" />
      </Conversation>

      {/* Floating footer area */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 overflow-x-visible px-2">
        <div className="relative mx-auto flex w-full max-w-3xl flex-col overflow-x-visible text-center">
          {/* Terms notice - fades with empty state */}
          {isNewChat && (
            <p
              className={`pointer-events-auto mb-2 text-center text-xs text-muted-foreground transition-opacity duration-200 ease-out ${
                isTyping ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
            >
              Make sure you agree to our{" "}
              <a href="#" className="font-medium text-foreground underline">
                Terms
              </a>{" "}
              and our{" "}
              <a href="#" className="font-medium text-foreground underline">
                Privacy Policy
              </a>
            </p>
          )}

          {/* Usage limit banner */}
          <UsageBanner />

          {/* Frosted glass wrapper with gradient border reflection */}
          <div className="pointer-events-auto">
            <div className="border-reflect pointer-events-none min-w-0 overflow-hidden rounded-t-[20px] bg-[var(--chat-input-background)] p-2 pb-0 backdrop-blur-lg">
              {/* Prompt input */}
              <PromptInput
                onSubmit={handleSubmit}
                className="pointer-events-auto w-full [&_[data-slot=input-group]]:rounded-t-xl [&_[data-slot=input-group]]:rounded-b-none [&_[data-slot=input-group]]:border [&_[data-slot=input-group]]:border-b-0 [&_[data-slot=input-group]]:border-black/30 [&_[data-slot=input-group]]:bg-[var(--chat-input-background)] [&_[data-slot=input-group]]:shadow-[0_80px_50px_rgba(0,0,0,0.08),0_50px_30px_rgba(0,0,0,0.06),0_30px_15px_rgba(0,0,0,0.05),0_15px_8px_rgba(0,0,0,0.04),0_6px_4px_rgba(0,0,0,0.03),0_2px_2px_rgba(0,0,0,0.02)] [&_[data-slot=input-group]]:outline-8 [&_[data-slot=input-group]]:outline-offset-0 [&_[data-slot=input-group]]:outline-[var(--chat-input-gradient)]/50 dark:[&_[data-slot=input-group]]:border-white/35 dark:[&_[data-slot=input-group]]:bg-[oklch(0.18_0_0_/_60%)] dark:[&_[data-slot=input-group]]:outline-[var(--chat-input-gradient)]/40"
              >
                <PromptInputBody>
                  <PromptInputTextarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={!canSend}
                    placeholder={canSend ? "Type your message here..." : "Daily limit reached — sign up to continue"}
                    className="min-h-12 text-base leading-6"
                  />
                </PromptInputBody>
                <PromptInputFooter className="@container">
                  <PromptInputTools>
                    {/* Model selector trigger */}
                    <ModelSelector
                      onOpenChange={setModelSelectorOpen}
                      open={modelSelectorOpen}
                    >
                      <ModelSelectorTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-w-0 max-w-[140px] gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground @md:max-w-none"
                        >
                          <div className="min-w-0 flex-1 text-left text-sm font-medium">
                            <div className="truncate">
                              {selectedModelData?.name ?? "Select model"}
                            </div>
                          </div>
                          <ChevronDownIcon className="size-4 text-muted-foreground/60 transition-transform duration-200" />
                        </Button>
                      </ModelSelectorTrigger>
                      <ModelSelectorContent title="Select a model">
                        <ModelSelectorInput placeholder="Search models..." />
                        <ModelSelectorList>
                          <ModelSelectorEmpty>
                            No models found.
                          </ModelSelectorEmpty>
                          {chefs.map((chef) => (
                            <ModelSelectorGroup heading={chef} key={chef}>
                              {models
                                .filter((m) => m.chef === chef)
                                .map((model) => (
                                  <ModelItem
                                    key={model.id}
                                    model={model}
                                    onSelect={handleModelSelect}
                                    selectedModel={selectedModel}
                                  />
                                ))}
                            </ModelSelectorGroup>
                          ))}
                        </ModelSelectorList>
                      </ModelSelectorContent>
                    </ModelSelector>

                    {/* Search button */}
                    <PromptInputButton
                      tooltip="Search the web"
                      variant="ghost"
                      className="gap-1.5 rounded-full border border-border/40 px-2.5 text-xs text-muted-foreground"
                    >
                      <GlobeIcon className="size-3.5" />
                      <span className="hidden @md:block">Search</span>
                    </PromptInputButton>

                    {/* Attachment button */}
                    <PromptInputButton
                      tooltip="Attach files"
                      variant="ghost"
                      className="rounded-full border border-border/40 px-2.5 text-muted-foreground"
                    >
                      <PaperclipIcon className="size-3.5" />
                    </PromptInputButton>
                  </PromptInputTools>

                  {/* Submit button */}
                  <PromptInputSubmit
                    disabled={!text.trim() || !canSend}
                    status={status}
                    className="border-reflect button-reflect size-9 rounded-lg bg-rose font-semibold text-rose-foreground shadow-sm hover:bg-rose/80 active:bg-rose disabled:hover:bg-rose dark:bg-primary/20 dark:text-pink-50 dark:hover:bg-pink-800/70 dark:active:bg-pink-800/40 dark:disabled:hover:bg-primary/20"
                  />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
