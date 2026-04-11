import { type ReactNode, useEffect, useMemo } from "react"
import { useAuth, useUser } from "@clerk/expo"

import { AuthContext, type AuthValue } from "@/lib/auth-context"
import { setClerkTokenGetter } from "@/lib/clerk-token"

export function ClerkAuthBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth()
  const { user } = useUser()

  useEffect(() => {
    setClerkTokenGetter(() => getToken())
    return () => setClerkTokenGetter(null)
  }, [getToken])

  const value = useMemo<AuthValue>(() => {
    const email = user?.primaryEmailAddress?.emailAddress ?? ""
    const displayName = user?.firstName?.trim() || email || "You"
    const initial = (displayName[0] ?? "Y").toUpperCase()
    return {
      enabled: true,
      isLoaded,
      isSignedIn: !!isSignedIn,
      user: user
        ? {
            id: user.id,
            email,
            displayName,
            initial,
          }
        : null,
      signOut: async () => {
        await signOut()
      },
    }
  }, [isLoaded, isSignedIn, user, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
