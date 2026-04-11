import { type ReactNode } from "react"
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native"
import { AIElementsProvider } from "@crafter/rn-ai-elements"
import { QueryClientProvider } from "@tanstack/react-query"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import "react-native-reanimated"

import { ChatContextProvider } from "@/lib/chat-context"
import { getClerkEntry } from "@/lib/clerk-entry"
import { queryClient } from "@/lib/query-client"
import { ThemeProvider, useThemeMode } from "@/lib/theme-store"
import { csChatDarkTheme, csChatLightTheme } from "@/lib/theme"

// Resolved once at module boot. Either gives us { ClerkWrapper, SignInSheet }
// or null if Clerk is disabled / the native module isn't linked yet.
const clerkEntry = getClerkEntry()

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatContextProvider>
        <ThemeProvider>
          <AuthShell>
            <ThemedApp />
          </AuthShell>
        </ThemeProvider>
      </ChatContextProvider>
    </QueryClientProvider>
  )
}

function AuthShell({ children }: { children: ReactNode }) {
  if (!clerkEntry) return <>{children}</>
  const { ClerkWrapper } = clerkEntry
  return <ClerkWrapper>{children}</ClerkWrapper>
}

function ThemedApp() {
  const { resolved } = useThemeMode()
  const isDark = resolved === "dark"

  return (
    <AIElementsProvider
      mode={isDark ? "dark" : "light"}
      theme={isDark ? csChatDarkTheme : csChatLightTheme}
    >
      <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
        <StatusBar style={isDark ? "light" : "dark"} />
      </NavigationThemeProvider>
    </AIElementsProvider>
  )
}
