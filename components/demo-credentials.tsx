"use client"

import { CheckIcon, CopyIcon, FlaskConicalIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"

/**
 * Seeded accounts from backend/database/seeders (AdminSeeder, DemoLedgerSeeder).
 * Shown only when the build sets NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true — inlined at
 * build time, so a production build without the flag ships none of this.
 */
export const DEMO_ENABLED = process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS === "true"

export const DEMO_ADMIN = { email: "admin@dube.test", password: "password" } as const
const DEMO_MERCHANT = { phone: "0911 000 001", pin: "123456" } as const

export function DemoCredentials({ onUse }: { onUse: (creds: typeof DEMO_ADMIN) => void }) {
  if (!DEMO_ENABLED) return null

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-primary/40 bg-primary/[0.04] p-3 text-sm">
      <div className="flex items-center gap-2 font-medium text-primary">
        <FlaskConicalIcon className="size-4" aria-hidden />
        Demo environment
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-muted-foreground">Email</dt>
        <dd className="flex min-w-0 items-center gap-1 font-mono text-xs">
          <span className="truncate">{DEMO_ADMIN.email}</span>
          <CopyButton value={DEMO_ADMIN.email} label="Copy admin email" />
        </dd>
        <dt className="text-muted-foreground">Password</dt>
        <dd className="flex items-center gap-1 font-mono text-xs">
          {DEMO_ADMIN.password}
          <CopyButton value={DEMO_ADMIN.password} label="Copy admin password" />
        </dd>
      </dl>

      <Button type="button" variant="secondary" size="sm" className="w-full" onClick={() => onUse(DEMO_ADMIN)}>
        Use demo admin account
      </Button>

      <p className="text-xs text-muted-foreground">
        Mobile app: phone <span className="font-mono">{DEMO_MERCHANT.phone}</span> · PIN{" "}
        <span className="font-mono">{DEMO_MERCHANT.pin}</span> (…001 to …008).
      </p>
    </div>
  )
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be blocked (insecure origin / permissions); the value is visible anyway.
    }
  }

  return (
    <Button type="button" variant="ghost" size="icon-xs" onClick={copy} aria-label={label}>
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  )
}
