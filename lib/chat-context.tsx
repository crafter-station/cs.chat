"use client";

import { createContext, useCallback, useContext, useState, useEffect } from "react";
import { useFingerprint } from "@/hooks/use-fingerprint";

interface ChatContextValue {
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  startNewChat: () => void;
  hydrated: boolean;
  visitorId: string | null;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const DEFAULT_MODEL = "openai/gpt-4o";
const ACTIVE_CHAT_KEY = "c3chat-active-thread";

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [activeChatId, setActiveChatIdRaw] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [hydrated, setHydrated] = useState(false);
  const { visitorId } = useFingerprint();

  // Restore last active thread after hydration to avoid SSR mismatch
  useEffect(() => {
    const stored = localStorage.getItem(ACTIVE_CHAT_KEY);
    if (stored) setActiveChatIdRaw(stored);
    setHydrated(true);
  }, []);

  const setActiveChatId = useCallback((id: string | null) => {
    setActiveChatIdRaw(id);
    if (id) {
      localStorage.setItem(ACTIVE_CHAT_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_CHAT_KEY);
    }
  }, []);

  const startNewChat = useCallback(() => {
    setActiveChatId(null);
  }, [setActiveChatId]);

  return (
    <ChatContext.Provider
      value={{
        activeChatId,
        setActiveChatId,
        selectedModel,
        setSelectedModel,
        startNewChat,
        hydrated,
        visitorId,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}
