import { Fragment } from "react"
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAIElementsTheme } from "@crafter/rn-ai-elements"
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect"
import { Moon, Plus, Sun, Trash2 } from "lucide-react-native"

import { useDeleteThread, useThreads } from "@/hooks/use-threads"
import { useAppAuth } from "@/lib/auth-context"
import type { ChatThread } from "@/lib/thread-api"
import { useThemeMode } from "@/lib/theme-store"

const SUPPORTS_GLASS = isLiquidGlassAvailable()

interface ChatSidebarProps {
  activeChatId: string | null
  onNewChat: () => void
  onSelectThread: (id: string) => void
  onSignInPress: () => void
}

export function ChatSidebar({
  activeChatId,
  onNewChat,
  onSelectThread,
  onSignInPress,
}: ChatSidebarProps) {
  const theme = useAIElementsTheme()
  const insets = useSafeAreaInsets()

  const { data: threads = [], isLoading } = useThreads()
  const deleteThread = useDeleteThread()
  const { resolved: resolvedTheme, toggle: toggleTheme } = useThemeMode()
  const isDark = resolvedTheme === "dark"
  const auth = useAppAuth()

  const handleProfilePress = () => {
    if (!auth.enabled) {
      Alert.alert(
        "Sign-in not configured",
        "Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in apps/mobile/.env to enable sign-in.",
      )
      return
    }
    if (!auth.isSignedIn) {
      onSignInPress()
      return
    }
    Alert.alert(
      "Sign out?",
      auth.user?.email || "",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            await auth.signOut()
          },
        },
      ],
    )
  }

  const initial = auth.isSignedIn && auth.user ? auth.user.initial : "Y"
  const label = auth.isSignedIn && auth.user ? auth.user.displayName : "Sign in"

  const handleDelete = (id: string) => {
    deleteThread.mutate(id)
    if (id === activeChatId) onNewChat()
  }

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.colors.card,
          paddingTop: insets.top + 12,
        },
      ]}
    >
      <Text style={[styles.brand, { color: theme.colors.foreground }]}>C3</Text>

      <Text
        style={[styles.sectionLabel, { color: theme.colors.mutedForeground }]}
      >
        Recent
      </Text>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {threads.length === 0 ? (
          <Text
            style={[styles.empty, { color: theme.colors.mutedForeground }]}
          >
            {isLoading ? "Loading..." : "No chats yet"}
          </Text>
        ) : (
          threads.map((thread) => (
            <ThreadRow
              key={thread.id}
              thread={thread}
              active={thread.id === activeChatId}
              onSelect={() => onSelectThread(thread.id)}
              onDelete={() => handleDelete(thread.id)}
            />
          ))
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 12,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <Pressable
          onPress={handleProfilePress}
          hitSlop={6}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <GlassView
            glassEffectStyle="regular"
            style={[
              styles.profile,
              {
                borderColor: theme.colors.border,
                backgroundColor: SUPPORTS_GLASS
                  ? "transparent"
                  : theme.colors.background,
              },
            ]}
          >
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[styles.avatarText, { color: theme.colors.foreground }]}
              >
                {initial}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[styles.profileName, { color: theme.colors.foreground }]}
            >
              {label}
            </Text>
          </GlassView>
        </Pressable>

        <View style={styles.footerActions}>
          <Pressable
            onPress={toggleTheme}
            hitSlop={6}
            accessibilityLabel={
              isDark ? "Switch to light theme" : "Switch to dark theme"
            }
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <GlassView
              glassEffectStyle="regular"
              style={[
                styles.themeButton,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: SUPPORTS_GLASS
                    ? "transparent"
                    : theme.colors.background,
                },
              ]}
            >
              {isDark ? (
                <Moon
                  size={18}
                  color={theme.colors.foreground}
                  strokeWidth={2}
                />
              ) : (
                <Sun
                  size={18}
                  color={theme.colors.foreground}
                  strokeWidth={2}
                />
              )}
            </GlassView>
          </Pressable>

          <Pressable
            onPress={onNewChat}
            hitSlop={6}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <GlassView
              glassEffectStyle="regular"
              tintColor={theme.colors.primary}
              style={[
                styles.newChatButton,
                {
                  backgroundColor: SUPPORTS_GLASS
                    ? "transparent"
                    : theme.colors.primary,
                },
              ]}
            >
              <Plus
                size={20}
                color={theme.colors.primaryForeground}
                strokeWidth={2.5}
              />
            </GlassView>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

interface ThreadRowProps {
  thread: ChatThread
  active: boolean
  onSelect: () => void
  onDelete: () => void
}

function ThreadRow({ thread, active, onSelect, onDelete }: ThreadRowProps) {
  const theme = useAIElementsTheme()
  const isUnnamed = !thread.title

  return (
    <Fragment>
      <View
        style={[
          styles.threadRow,
          active ? { backgroundColor: theme.colors.muted } : null,
        ]}
      >
        <Pressable
          onPress={onSelect}
          style={({ pressed }) => [
            styles.threadButton,
            pressed ? { opacity: 0.6 } : null,
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.threadText,
              {
                color: isUnnamed
                  ? theme.colors.mutedForeground
                  : theme.colors.foreground,
                fontStyle: isUnnamed ? "italic" : "normal",
              },
            ]}
          >
            {thread.title ?? "New chat"}
          </Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          hitSlop={6}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed ? { opacity: 0.5 } : null,
          ]}
        >
          <Trash2
            size={14}
            color={theme.colors.mutedForeground}
            strokeWidth={2}
          />
        </Pressable>
      </View>
    </Fragment>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 20,
  },
  brand: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginTop: 8,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "500",
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 12,
  },
  empty: {
    fontSize: 14,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  threadRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 2,
    paddingRight: 8,
  },
  threadButton: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  threadText: {
    fontSize: 15,
    fontWeight: "500",
  },
  deleteButton: {
    padding: 6,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingLeft: 5,
    paddingRight: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "600",
  },
  profileName: {
    fontSize: 14,
    fontWeight: "500",
  },
  newChatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  footerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  themeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
})
