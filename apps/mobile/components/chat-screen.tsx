import {
  type ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Keyboard, Pressable, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useChat } from "@ai-sdk/react"
import { useQueryClient } from "@tanstack/react-query"
import { type UIMessage } from "ai"
import * as Haptics from "expo-haptics"
import {
  ChatMessageItem,
  Conversation,
  type ConversationRef,
  ConversationScrollButton,
  createStreamingTransport,
  PromptInput,
  Suggestion,
  uiMessageToChatMessageData,
  useAIElementsTheme,
} from "@crafter/rn-ai-elements"
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect"
import { type LucideProps, PanelLeft, Plus } from "lucide-react-native"
import { nanoid } from "nanoid/non-secure"

import { CHAT_ENDPOINT } from "@/lib/api"
import { useAppAuth } from "@/lib/auth-context"
import { useChatContext } from "@/lib/chat-context"
import { getClerkEntry } from "@/lib/clerk-entry"
import { getClerkToken } from "@/lib/clerk-token"
import { fetchThreadMessages, saveThreadMessages } from "@/lib/thread-api"
import { AppDrawer } from "@/components/app-drawer"
import { ChatSidebar } from "@/components/chat-sidebar"
import {
  ModelSelectorMenu,
  ModelSelectorTrigger,
} from "@/components/model-selector"
import { UsageBanner } from "@/components/usage-banner"

// Lazily-loaded SignInSheet so Clerk's native deps don't crash the bundle
// when the dev client isn't rebuilt yet. Null → sign-in unavailable.
const LazySignInSheet = getClerkEntry()?.SignInSheet ?? null
import {
  useCreateThread,
  useGenerateTitle,
  useThreads,
  useUpdateThreadModel,
} from "@/hooks/use-threads"
import { useUsage } from "@/hooks/use-usage"

const SUPPORTS_GLASS = isLiquidGlassAvailable()

const SUGGESTIONS = [
  { label: "How does AI work?" },
  { label: "Are black holes real?" },
  { label: 'How many Rs are in "strawberry"?' },
  { label: "What is the meaning of life?" },
]

export function ChatScreen() {
  const theme = useAIElementsTheme()
  const insets = useSafeAreaInsets()
  const [input, setInput] = useState("")
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
  const auth = useAppAuth()
  const conversationRef = useRef<ConversationRef>(null)

  const {
    visitorId,
    activeChatId,
    setActiveChatId,
    selectedModel,
    setSelectedModel,
  } = useChatContext()

  const queryClient = useQueryClient()
  const { data: threads } = useThreads()
  const { data: usage } = useUsage()
  const canSend = usage?.canSend !== false
  const threadsRef = useRef(threads)
  threadsRef.current = threads

  const createThread = useCreateThread()
  const updateThreadModel = useUpdateThreadModel()
  const generateTitle = useGenerateTitle()

  // Promise that resolves once the active thread row exists in the DB.
  // Required before we can persist messages to it.
  const threadReadyRef = useRef<Promise<unknown> | null>(null)
  // Set when the user just created a new thread inline via handleSubmit, so
  // the activeChatId load-effect can skip the server fetch that would
  // otherwise wipe the freshly-sent user message.
  const freshChatRef = useRef(false)

  const modelRef = useRef(selectedModel)
  modelRef.current = selectedModel
  const visitorIdRef = useRef(visitorId)
  visitorIdRef.current = visitorId

  const transport = useMemo(
    () =>
      createStreamingTransport({
        api: CHAT_ENDPOINT,
        body: () => ({
          model: modelRef.current,
          fingerprintId: visitorIdRef.current,
        }),
        headers: async (): Promise<Record<string, string>> => {
          const token = await getClerkToken()
          const headers: Record<string, string> = {}
          if (token) headers.Authorization = `Bearer ${token}`
          return headers
        },
      }),
    [],
  )

  const { messages, sendMessage, setMessages, status, stop, error } = useChat({
    transport,
    onError: (err) => console.warn("[chat]", err),
  })

  const isBusy = status === "submitted" || status === "streaming"

  // Light impact when the reply starts arriving (submitted → streaming).
  const prevStatusRef = useRef(status)
  useEffect(() => {
    if (prevStatusRef.current === "submitted" && status === "streaming") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    }
    prevStatusRef.current = status
  }, [status])

  // Load messages when the active thread changes.
  useEffect(() => {
    if (!activeChatId) {
      setMessages([])
      return
    }

    // Fresh chat just created by handleSubmit — the user message is already
    // in useChat's state and the response is streaming. Don't fetch.
    if (freshChatRef.current) {
      freshChatRef.current = false
      return
    }

    // Restore the thread's stored model.
    const thread = threadsRef.current?.find((t) => t.id === activeChatId)
    if (thread) setSelectedModel(thread.model)

    let cancelled = false
    fetchThreadMessages(activeChatId)
      .then((msgs) => {
        if (cancelled) return
        setMessages(msgs)
      })
      .catch((err) => console.warn("[chat] load messages", err))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId])

  // Re-fetch threads + usage whenever the user signs in or out so the
  // sidebar reflects the linked Clerk account immediately.
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["threads"] })
    queryClient.invalidateQueries({ queryKey: ["usage"] })
  }, [auth.isSignedIn, queryClient])

  // Persist the conversation when a stream completes.
  useEffect(() => {
    if (status !== "ready" || !activeChatId || messages.length === 0) return

    const save = async () => {
      if (threadReadyRef.current) {
        try {
          await threadReadyRef.current
        } catch {
          return
        }
      }
      try {
        await saveThreadMessages(activeChatId, messages)
      } catch (err) {
        console.warn("[chat] save messages", err)
      }
      queryClient.invalidateQueries({ queryKey: ["usage"] })
    }
    save()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, activeChatId])

  const handleSubmit = useCallback(() => {
    const text = input.trim()
    if (!text || isBusy || !visitorId || !canSend) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setInput("")

    if (!activeChatId) {
      const newId = nanoid()
      freshChatRef.current = true
      threadReadyRef.current = createThread.mutateAsync({
        id: newId,
        model: selectedModel,
      })
      generateTitle.mutate({ prompt: text, threadId: newId })
      setActiveChatId(newId)
    }

    sendMessage({ text })
  }, [
    input,
    isBusy,
    visitorId,
    canSend,
    activeChatId,
    selectedModel,
    createThread,
    generateTitle,
    setActiveChatId,
    sendMessage,
  ])

  const handleSuggestion = useCallback(
    (text: string) => {
      if (isBusy || !visitorId || !canSend) return
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
      if (!activeChatId) {
        const newId = nanoid()
        freshChatRef.current = true
        threadReadyRef.current = createThread.mutateAsync({
          id: newId,
          model: selectedModel,
        })
        generateTitle.mutate({ prompt: text, threadId: newId })
        setActiveChatId(newId)
      }
      sendMessage({ text })
    },
    [
      isBusy,
      visitorId,
      canSend,
      activeChatId,
      selectedModel,
      createThread,
      generateTitle,
      setActiveChatId,
      sendMessage,
    ],
  )

  const handleNewChat = useCallback(() => {
    Keyboard.dismiss()
    if (isBusy) stop()
    threadReadyRef.current = null
    setActiveChatId(null)
    setMessages([])
    setInput("")
    setDrawerOpen(false)
  }, [isBusy, stop, setActiveChatId, setMessages])

  const handleSelectThread = useCallback(
    (id: string) => {
      Keyboard.dismiss()
      if (isBusy) stop()
      threadReadyRef.current = null
      setActiveChatId(id)
      setDrawerOpen(false)
    },
    [isBusy, stop, setActiveChatId],
  )

  const handleModelSelect = useCallback(
    (id: string) => {
      setSelectedModel(id)
      if (activeChatId) {
        updateThreadModel.mutate({ id: activeChatId, model: id })
      }
    },
    [setSelectedModel, activeChatId, updateThreadModel],
  )

  const handleOpenModelMenu = useCallback(() => {
    Keyboard.dismiss()
    setModelMenuOpen(true)
  }, [])

  const handleToggleDrawer = useCallback(() => {
    Keyboard.dismiss()
    setDrawerOpen((v) => !v)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
  }, [])

  const handleSignInPress = useCallback(() => {
    Keyboard.dismiss()
    setDrawerOpen(false)
    setSignInOpen(true)
  }, [])

  const handleDismissKeyboard = useCallback(() => {
    Keyboard.dismiss()
  }, [])

  const renderMessage = useCallback(
    (msg: UIMessage) => (
      <ChatMessageItem item={uiMessageToChatMessageData(msg)} />
    ),
    [],
  )

  return (
    <>
      <AppDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        drawer={
          <ChatSidebar
            activeChatId={activeChatId}
            onNewChat={handleNewChat}
            onSelectThread={handleSelectThread}
            onSignInPress={handleSignInPress}
          />
        }
      >
        <View
          style={[
            styles.root,
            {
              backgroundColor: theme.colors.background,
              paddingTop: insets.top,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={[styles.headerSide, styles.headerSideLeft]}>
              <HeaderIconButton
                icon={PanelLeft}
                onPress={handleToggleDrawer}
              />
            </View>
            <ModelSelectorTrigger
              selectedModelId={selectedModel}
              onPress={handleOpenModelMenu}
            />
            <View style={[styles.headerSide, styles.headerSideRight]}>
              <HeaderIconButton icon={Plus} onPress={handleNewChat} />
            </View>
          </View>

          <Pressable
            onPress={handleDismissKeyboard}
            style={styles.conversation}
          >
            <Conversation
              ref={conversationRef}
              style={styles.conversation}
              messages={messages}
              renderMessage={renderMessage}
              isStreaming={isBusy}
              onIsAtBottomChange={setIsAtBottom}
              emptyState={<View style={styles.emptyState} />}
            />
          </Pressable>

          <ConversationScrollButton
            visible={!isAtBottom && messages.length > 0}
            onPress={() => conversationRef.current?.scrollToBottom()}
            style={styles.scrollButton}
          />

          <PromptInput
            value={input}
            onChangeText={setInput}
            onSubmit={handleSubmit}
            onStop={stop}
            status={error ? "error" : status}
            disabled={!canSend}
            placeholder={
              !canSend
                ? "Daily limit reached"
                : "Ask C3 anything..."
            }
            bottomInset={insets.bottom}
            suggestions={
              <>
                <UsageBanner />
                {messages.length === 0 && canSend ? (
                  <View style={styles.suggestionsWrap}>
                    <Suggestion
                      suggestions={SUGGESTIONS}
                      onSelect={handleSuggestion}
                    />
                  </View>
                ) : null}
              </>
            }
          />
        </View>
      </AppDrawer>

      <ModelSelectorMenu
        visible={modelMenuOpen}
        selectedModelId={selectedModel}
        onSelect={handleModelSelect}
        onClose={() => setModelMenuOpen(false)}
      />

      {LazySignInSheet ? (
        <LazySignInSheet
          visible={signInOpen}
          onClose={() => setSignInOpen(false)}
        />
      ) : null}
    </>
  )
}

interface HeaderIconButtonProps {
  icon: ComponentType<LucideProps>
  onPress: () => void
}

function HeaderIconButton({ icon: Icon, onPress }: HeaderIconButtonProps) {
  const theme = useAIElementsTheme()
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
    >
      <GlassView
        glassEffectStyle="regular"
        style={[
          styles.headerButton,
          {
            borderColor: theme.colors.border,
            backgroundColor: SUPPORTS_GLASS
              ? "transparent"
              : theme.colors.card,
          },
        ]}
      >
        <Icon size={18} color={theme.colors.foreground} strokeWidth={2} />
      </GlassView>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerSide: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerSideLeft: {
    justifyContent: "flex-start",
  },
  headerSideRight: {
    justifyContent: "flex-end",
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  conversation: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
  },
  scrollButton: {
    position: "absolute",
    alignSelf: "center",
    bottom: 96,
  },
  suggestionsWrap: {
    marginBottom: 6,
  },
})
