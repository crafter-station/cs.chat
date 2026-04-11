import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { DEFAULT_MODEL_ID } from "@cs-chat/shared"
import { getOrCreateVisitorId } from "@/lib/visitor-id"

interface ChatContextValue {
  visitorId: string | null
  activeChatId: string | null
  setActiveChatId: (id: string | null) => void
  selectedModel: string
  setSelectedModel: (model: string) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatContextProvider({ children }: { children: ReactNode }) {
  const [visitorId, setVisitorId] = useState<string | null>(null)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_ID)

  useEffect(() => {
    let cancelled = false
    getOrCreateVisitorId().then((id) => {
      if (!cancelled) setVisitorId(id)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<ChatContextValue>(
    () => ({
      visitorId,
      activeChatId,
      setActiveChatId,
      selectedModel,
      setSelectedModel,
    }),
    [visitorId, activeChatId, selectedModel],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) {
    throw new Error("useChatContext must be used inside ChatContextProvider")
  }
  return ctx
}
