import type { AIElementsTheme } from "@crafter/rn-ai-elements"

export const ROSE = "#B8477A"
export const ROSE_FOREGROUND = "#FFFFFF"

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export const csChatDarkTheme: DeepPartial<AIElementsTheme> = {
  dark: true,
  colors: {
    background: "#0B080E",
    foreground: "#F5F5F7",
    card: "#141019",
    cardForeground: "#F5F5F7",
    primary: ROSE,
    primaryForeground: ROSE_FOREGROUND,
    secondary: "#221A2A",
    secondaryForeground: "#F5F5F7",
    muted: "#1B1522",
    mutedForeground: "#9A91A3",
    accent: "#2A2135",
    accentForeground: "#F5F5F7",
    border: "rgba(255,255,255,0.06)",
    destructive: "#E5484D",
    destructiveForeground: "#F5F5F7",
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    full: 9999,
  },
}

export const csChatLightTheme: DeepPartial<AIElementsTheme> = {
  dark: false,
  colors: {
    background: "#F6F6F6",
    foreground: "#1A1419",
    card: "#FFFFFF",
    cardForeground: "#1A1419",
    primary: ROSE,
    primaryForeground: ROSE_FOREGROUND,
    secondary: "#EBEBEB",
    secondaryForeground: "#1A1419",
    muted: "#EBEBEB",
    mutedForeground: "#6B6469",
    accent: "#EBEBEB",
    accentForeground: "#1A1419",
    border: "rgba(0,0,0,0.08)",
    destructive: "#E5484D",
    destructiveForeground: "#FFFFFF",
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    full: 9999,
  },
}
