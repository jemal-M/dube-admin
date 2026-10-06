"use client"

import { Loader2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"

import { BrandMark } from "@/components/brand-mark"
import { DemoCredentials } from "@/components/demo-credentials"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { api, ApiError } from "@/lib/api/client"
import type { AdminUser } from "@/lib/api/types"
import { isSessionValid, useAuthStore, useSessionHydrated } from "@/lib/stores/auth-store"

type TokenResponse = { token: string; expires_at: string | null; user: AdminUser }

export default function LoginPage() {
  const router = useRouter()
  const signIn = useAuthStore((s) => s.signIn)
  const hasHydrated = useSessionHydrated()
  const alreadySignedIn = useAuthStore(isSessionValid)
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  React.useEffect(() => {
    if (hasHydrated && alreadySignedIn) router.replace("/")
  }, [hasHydrated, alreadySignedIn, router])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const res = await api<TokenResponse>("admin/auth/token", {
        method: "POST",
        body: { email, password },
      })
      signIn({ token: res.token, expiresAt: res.expires_at, user: res.user })
      router.replace("/")
    } catch (e) {
      setError(
        e instanceof ApiError
          ? (e.firstError("email") ?? e.message)
          : "Cannot reach the server. Check your connection."
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50rem_30rem_at_50%_-10%,color-mix(in_oklch,var(--primary),transparent_90%),transparent)]"
      />
      <Card className="relative w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <BrandMark priority className="mx-auto mb-2 size-20 rounded-2xl shadow-lg shadow-primary/20" />
          <CardTitle className="text-xl">ዱቤ Admin</CardTitle>
          <CardDescription>Sign in with your platform admin account.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* method="post": if JavaScript ever fails to load, a native submit must not put the password in the URL. */}
          <form method="post" onSubmit={onSubmit}>
            <FieldGroup>
              <Field data-invalid={!!error || undefined}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field data-invalid={!!error || undefined}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {error && <FieldError>{error}</FieldError>}
              </Field>
              <Button type="submit" size="lg" disabled={pending} className="w-full">
                {pending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
                Sign in
              </Button>
              <DemoCredentials
                onUse={(demo) => {
                  setEmail(demo.email)
                  setPassword(demo.password)
                  setError(null)
                }}
              />
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
