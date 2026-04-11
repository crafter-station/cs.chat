import AsyncStorage from "@react-native-async-storage/async-storage"
import { nanoid } from "nanoid/non-secure"

const KEY = "cs-chat:visitor-id"

// Cache so a single session keeps a stable ID even if AsyncStorage is
// unavailable (e.g., dev client hasn't been rebuilt yet and the native
// module isn't linked).
let cachedId: string | null = null

export async function getOrCreateVisitorId(): Promise<string> {
  if (cachedId) return cachedId

  try {
    const existing = await AsyncStorage.getItem(KEY)
    if (existing) {
      cachedId = existing
      return existing
    }
    const fresh = nanoid()
    await AsyncStorage.setItem(KEY, fresh)
    cachedId = fresh
    return fresh
  } catch (err) {
    console.warn(
      "[visitor-id] AsyncStorage unavailable, falling back to in-memory id. " +
        "Rebuild the dev client (bun ios / bun android) to persist across launches.",
      err,
    )
    const fresh = nanoid()
    cachedId = fresh
    return fresh
  }
}
