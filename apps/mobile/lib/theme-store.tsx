import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useColorScheme } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

type ThemeMode = "light" | "dark" | "system"

interface ThemeContextValue {
  mode: ThemeMode
  resolved: "light" | "dark"
  setMode: (m: ThemeMode) => void
  toggle: () => void
}

const KEY = "cs-chat:theme"

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme()
  const [mode, setModeState] = useState<ThemeMode>("system")

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((value) => {
        if (value === "light" || value === "dark" || value === "system") {
          setModeState(value)
        }
      })
      .catch(() => {
        // AsyncStorage unavailable (dev client not rebuilt); stay on default.
      })
  }, [])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    AsyncStorage.setItem(KEY, next).catch(() => {})
  }, [])

  const resolved: "light" | "dark" =
    mode === "system" ? (system === "dark" ? "dark" : "light") : mode

  const toggle = useCallback(() => {
    setMode(resolved === "dark" ? "light" : "dark")
  }, [resolved, setMode])

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolved, setMode, toggle }),
    [mode, resolved, setMode, toggle],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error("useThemeMode must be used inside ThemeProvider")
  }
  return ctx
}
