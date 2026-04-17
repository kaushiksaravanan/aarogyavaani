/**
 * Safe auth hook that works with or without Clerk provider.
 * When Clerk is not configured (no publishable key), returns guest defaults.
 */
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-react'

const CLERK_AVAILABLE = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const guestAuth = {
  isSignedIn: false,
  isLoaded: true,
  userId: null,
  sessionId: null,
  signOut: () => Promise.resolve(),
}

const guestUser = {
  isSignedIn: false,
  isLoaded: true,
  user: null,
}

export function useAuthSafe() {
  if (!CLERK_AVAILABLE) return guestAuth
  try {
    return useClerkAuth()
  } catch {
    return guestAuth
  }
}

export function useUserSafe() {
  if (!CLERK_AVAILABLE) return guestUser
  try {
    return useClerkUser()
  } catch {
    return guestUser
  }
}

export { CLERK_AVAILABLE }
