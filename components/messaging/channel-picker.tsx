"use client"

import {
  BellIcon,
  MailIcon,
  MessageSquareIcon,
  SmartphoneIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Channel } from "@/lib/api/types"
import { CHANNEL_LABELS } from "@/lib/format"

const ICONS = {
  inapp: BellIcon,
  push: SmartphoneIcon,
  email: MailIcon,
  sms: MessageSquareIcon,
}

/** Toggle buttons for in-app / push / email / SMS. At least one stays selected. */
export function ChannelPicker({
  value,
  onChange,
}: {
  value: Channel[]
  onChange: (v: Channel[]) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(["inapp", "push", "email", "sms"] as const).map((c) => {
        const on = value.includes(c)
        const Icon = ICONS[c]
        return (
          <Button
            key={c}
            type="button"
            size="sm"
            variant={on ? "default" : "outline"}
            aria-pressed={on}
            onClick={() =>
              onChange(
                on
                  ? value.length > 1
                    ? value.filter((x) => x !== c)
                    : value
                  : [...value, c]
              )
            }
          >
            <Icon data-icon="inline-start" />
            {CHANNEL_LABELS[c]}
          </Button>
        )
      })}
    </div>
  )
}

/** Clickable {{placeholder}} chips that insert at the cursor of the last-focused field. */
export function PlaceholderChips({
  placeholders,
  onInsert,
}: {
  placeholders: string[]
  onInsert: (token: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {placeholders.map((p) => (
        <button
          key={p}
          type="button"
          onMouseDown={(e) => e.preventDefault()} // keep focus in the field being edited
          onClick={() => onInsert(`{{${p}}}`)}
          className="rounded-md border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground hover:text-foreground"
        >
          {`{{${p}}}`}
        </button>
      ))}
    </div>
  )
}

/** Inserts text at the caret of a textarea/input and returns the new value. */
export function insertAtCursor(
  el: HTMLInputElement | HTMLTextAreaElement | null,
  current: string,
  token: string
): string {
  if (!el) return current + token
  const start = el.selectionStart ?? current.length
  const end = el.selectionEnd ?? current.length
  const next = current.slice(0, start) + token + current.slice(end)
  requestAnimationFrame(() => {
    el.focus()
    el.setSelectionRange(start + token.length, start + token.length)
  })
  return next
}
