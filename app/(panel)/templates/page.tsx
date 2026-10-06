"use client"

import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { ChannelPicker, insertAtCursor, PlaceholderChips } from "@/components/messaging/channel-picker"
import { PageHeader } from "@/components/page-header"
import { Textarea } from "@/components/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api/client"
import { useDeleteTemplate, useSaveTemplate, useTemplates } from "@/lib/api/queries"
import type { MessageTemplate } from "@/lib/api/types"
import { CHANNEL_LABELS } from "@/lib/format"

const SYSTEM_HINTS: Record<string, string> = {
  welcome: "Sent when a merchant registers or you create their account.",
  trial_ending: "Sent the day before a free trial ends.",
  subscription_ending: "Sent 3 days before a paid period ends.",
  subscription_expired: "Sent when sync gets blocked after the grace period.",
  payment_received: "Sent when a merchant submits a payment for review.",
  payment_approved: "Sent when you approve a payment.",
  payment_rejected: "Sent when you reject a payment ({{reason}} is your reason).",
}

export default function TemplatesPage() {
  const { data, isPending } = useTemplates()
  const remove = useDeleteTemplate()
  const [editing, setEditing] = React.useState<Partial<MessageTemplate> | null>(null)

  return (
    <>
      <PageHeader
        title="Message templates"
        description="Reusable wording for announcements. System templates are sent automatically on billing events — edit their text freely."
        actions={
          <Button onClick={() => setEditing({ channels: ["inapp", "push"], name: "", subject: "", body: "" })}>
            <PlusIcon data-icon="inline-start" />
            New template
          </Button>
        }
      />
      {isPending && <Skeleton className="h-40 w-full" />}
      <div className="grid gap-4 lg:grid-cols-2">
        {data?.data.map((t) => (
          <Card key={t.id} size="sm">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                {t.name}
                {t.key && <Badge variant="secondary">System</Badge>}
              </CardTitle>
              <CardDescription>{t.key ? SYSTEM_HINTS[t.key] : "Custom template"}</CardDescription>
              <CardAction className="flex gap-1">
                <Button variant="ghost" size="icon-sm" aria-label="Edit template" onClick={() => setEditing(t)}>
                  <PencilIcon />
                </Button>
                {!t.key && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete template"
                    onClick={() => remove.mutate(t.id, { onSuccess: () => toast.success("Template deleted"), onError: (e) => toast.error(e.message) })}
                  >
                    <Trash2Icon />
                  </Button>
                )}
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{t.subject}</p>
              <p className="line-clamp-3 whitespace-pre-line text-muted-foreground">{t.body}</p>
              <div className="flex flex-wrap gap-1">
                {t.channels.map((c) => (
                  <Badge key={c} variant="outline">
                    {CHANNEL_LABELS[c]}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {editing && data && <TemplateDialog initial={editing} placeholders={data.placeholders} onClose={() => setEditing(null)} />}
    </>
  )
}

function TemplateDialog({
  initial,
  placeholders,
  onClose,
}: {
  initial: Partial<MessageTemplate>
  placeholders: string[]
  onClose: () => void
}) {
  const [t, setT] = React.useState(initial)
  const save = useSaveTemplate()
  // Last-focused field, so placeholder chips insert where the admin was typing.
  const [last, setLast] = React.useState<{ el: HTMLInputElement | HTMLTextAreaElement; key: "subject" | "body" | "sms_body" } | null>(null)
  const err = save.error instanceof ApiError ? (Object.values(save.error.errors)[0]?.[0] ?? save.error.message) : save.error?.message
  const field = (key: "subject" | "body" | "sms_body") => ({
    value: t[key] ?? "",
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => setLast({ el: e.currentTarget, key }),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setT({ ...t, [key]: e.target.value }),
  })

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.id ? `Edit “${t.name}”` : "New template"}</DialogTitle>
          <DialogDescription>Click a placeholder to insert it where your cursor is.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="tpl-name">Name</FieldLabel>
            <Input id="tpl-name" value={t.name ?? ""} onChange={(e) => setT({ ...t, name: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel>Default channels</FieldLabel>
            <ChannelPicker value={t.channels ?? ["inapp"]} onChange={(channels) => setT({ ...t, channels })} />
          </Field>
          <Field>
            <FieldLabel htmlFor="tpl-subject">Title / email subject</FieldLabel>
            <Input id="tpl-subject" maxLength={150} {...field("subject")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="tpl-body">Message</FieldLabel>
            <Textarea id="tpl-body" rows={5} {...field("body")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="tpl-sms">SMS text (optional, shorter)</FieldLabel>
            <Textarea id="tpl-sms" rows={2} maxLength={320} {...field("sms_body")} />
            <FieldDescription>Used for SMS instead of the message when set.</FieldDescription>
          </Field>
          <PlaceholderChips
            placeholders={placeholders}
            onInsert={(token) => {
              const key = last?.key ?? "body"
              setT((x) => ({ ...x, [key]: insertAtCursor(last?.el ?? null, (x[key] as string) ?? "", token) }))
            }}
          />
        </FieldGroup>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <DialogFooter>
          <Button
            disabled={save.isPending || !t.name?.trim() || !t.subject?.trim() || !t.body?.trim()}
            onClick={() =>
              save.mutate(
                { id: t.id, name: t.name, subject: t.subject, body: t.body, sms_body: t.sms_body || null, channels: t.channels },
                {
                  onSuccess: () => {
                    toast.success("Template saved")
                    onClose()
                  },
                }
              )
            }
          >
            {save.isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
            Save template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
