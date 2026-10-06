"use client"

import { Loader2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"

import { isSessionValid, useAuthStore, useSessionHydrated } from "@/lib/stores/auth-store"

/**
 * Pages are prerendered without a session (static export), so auth is enforced
 * on the client once the persisted Zustand session has been read.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const hasHydrated = useSessionHydrated()
  const valid = useAuthStore(isSessionValid)

  React.useEffect(() => {
    if (hasHydrated && !valid) router.replace("/login/")
  }, [hasHydrated, valid, router])

  if (!hasHydrated || !valid) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-primary" aria-label="Loading" />
      </div>
    )
  }

  return children
}
