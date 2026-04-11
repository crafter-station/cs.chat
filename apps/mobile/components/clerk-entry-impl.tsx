import { type ReactNode } from "react"
import { ClerkProvider } from "@clerk/expo"
import { tokenCache } from "@clerk/expo/token-cache"

import { CLERK_PUBLISHABLE_KEY } from "@/lib/auth-context"
import { ClerkAuthBridge } from "@/components/clerk-auth-bridge"
import { SignInSheet } from "@/components/sign-in-sheet"

export function ClerkWrapper({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  )
}

export { SignInSheet }
