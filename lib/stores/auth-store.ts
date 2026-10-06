"use client"

import * as React from "react"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import type { AdminUser } from "@/lib/api/types"

type AuthState = {
  token: string | null
  expiresAt: string | null
  user: AdminUser | null
  signIn: (session: { token: string; expiresAt: string | null; user: AdminUser }) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      expiresAt: null,
      user: null,
      signIn: ({ token, expiresAt, user }) => set({ token, expiresAt, user }),
      signOut: () => set({ token: null, expiresAt: null, user: null }),
    }),
    {
      name: "dube-admin-session",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ token, expiresAt, user }) => ({ token, expiresAt, user }),
    }
  )
)

/**
 * True once the persisted session has been read from localStorage. Always false
 * during static prerender (no localStorage), so guarded pages render a spinner
 * in the HTML shell and decide on the client.
 */
export function useSessionHydrated(): boolean {
  return React.useSyncExternalStore(
    (onChange) => useAuthStore.persist.onFinishHydration(onChange),
    () => useAuthStore.persist.hasHydrated(),
    () => false
  )
}

export function isSessionValid(state: Pick<AuthState, "token" | "expiresAt">): boolean {
  if (!state.token) return false
  return !state.expiresAt || new Date(state.expiresAt).getTime() > Date.now()
}
