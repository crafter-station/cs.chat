import { createContext, useContext } from "react"

export interface AuthUser {
  id: string
  email: string
  displayName: string
  initial: string
}

export interface AuthValue {
  enabled: boolean
  isLoaded: boolean
  isSignedIn: boolean
  user: AuthUser | null
  signOut: () => Promise<void>
}

const disabledValue: AuthValue = {
  enabled: false,
  isLoaded: true,
  isSignedIn: false,
  user: null,
  signOut: async () => {},
}

export const AuthContext = createContext<AuthValue>(disabledValue)

export function useAppAuth(): AuthValue {
  return useContext(AuthContext)
}

export const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""

export const CLERK_ENABLED = CLERK_PUBLISHABLE_KEY.length > 0
