import { Platform } from "react-native"

const fallbackHost = Platform.select({
  android: "10.0.2.2",
  default: "localhost",
})

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? `http://${fallbackHost}:3000`

export const CHAT_ENDPOINT = `${API_BASE_URL}/api/chat`
