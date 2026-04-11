import { type ComponentType, type ReactNode } from "react"

import { CLERK_ENABLED } from "@/lib/auth-context"

export interface ClerkEntry {
  ClerkWrapper: ComponentType<{ children: ReactNode }>
  SignInSheet: ComponentType<{ visible: boolean; onClose: () => void }>
}

let cached: ClerkEntry | null = null
let attempted = false

/**
 * Lazily loads the Clerk-touching modules so that native-module errors
 * inside `@clerk/expo` (e.g. when the dev client hasn't been rebuilt to
 * include `expo-secure-store`) don't crash the bundle. Falls back to
 * anonymous mode when the require fails or when sign-in is disabled.
 */
export function getClerkEntry(): ClerkEntry | null {
  if (attempted) return cached
  attempted = true
  if (!CLERK_ENABLED) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@/components/clerk-entry-impl") as ClerkEntry
    cached = mod
    return mod
  } catch (err) {
    if (__DEV__) {
      console.warn(
        "[auth] Clerk failed to load. Rebuild the dev client (bun ios / bun android) to enable sign-in.",
        err,
      )
    }
    return null
  }
}
