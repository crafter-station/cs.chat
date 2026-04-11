"use client";

import { useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { EmptyState } from "@/components/chat/empty-state";
import { MessageList } from "@/components/chat/message-list";
import { ThreadTitle } from "@/components/chat/thread-title";
import { ChatInput } from "@/components/chat/chat-input";
import { useChatController } from "@/hooks/use-chat-controller";

export default function Home() {
  const [text, setText] = useState("");

  const {
    messages,
    status,
    activeChatId,
    selectedModel,
    hydrated,
    canSend,
    isGenerating,
    activeThread,
    textareaRef,
    handleSubmit,
    handleModelSelect,
  } = useChatController();

  const hasMessages = messages.length > 0;
  const isNewChat = hydrated && !hasMessages && !activeChatId;
  const isTyping = text.length > 0;

  const onSubmit = (inputText: string) => {
    handleSubmit(inputText);
    setText("");
  };

  return (
    <div className={`relative flex flex-1 flex-col overflow-hidden transition-opacity duration-300 ${hydrated ? "opacity-100" : "opacity-0"}`}>
      {/* Top gradient fade zone */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-background to-transparent sm:h-10" />

      {/* Floating sidebar trigger — top-left */}
      <div className="pointer-events-none absolute left-3 top-2.5 z-20">
        <SidebarTrigger className="pointer-events-auto rounded-md backdrop-blur-sm transition-colors hover:bg-background/80" />
      </div>

      {/* Floating thread title — top-center, desktop only */}
      {activeChatId && <ThreadTitle activeThread={activeThread} />}

      {/* Conversation area — key forces remount on thread switch (no stale scroll) */}
      <Conversation key={activeChatId ?? "new"} initial="instant">
        <ConversationContent
          className={
            isNewChat ? "justify-center pb-40" : "pt-16 pb-40 sm:pt-12"
          }
        >
          {isNewChat ? (
            <EmptyState isTyping={isTyping} onSuggestionClick={onSubmit} />
          ) : (
            <MessageList messages={messages} status={status} />
          )}
        </ConversationContent>
        <ConversationScrollButton className="bottom-36" />
      </Conversation>

      {/* Floating footer area */}
      <ChatInput
        textareaRef={textareaRef}
        selectedModel={selectedModel}
        canSend={canSend}
        isGenerating={isGenerating}
        isNewChat={isNewChat}
        isTyping={isTyping}
        status={status}
        text={text}
        onTextChange={setText}
        onSubmit={onSubmit}
        onModelSelect={handleModelSelect}
      />
    </div>
  );
}
