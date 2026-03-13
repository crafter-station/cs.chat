"use client";

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
import type { UIMessage, SourceUrlUIPart, ChatStatus } from "ai";

interface MessageListProps {
  messages: UIMessage[];
  status: ChatStatus;
}

export function MessageList({ messages, status }: MessageListProps) {
  return (
    <>
      {messages.map((message, messageIndex) => {
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
      })}
    </>
  );
}
