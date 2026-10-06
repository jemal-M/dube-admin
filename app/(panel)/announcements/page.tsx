"use client"

import { EyeIcon, Loader2Icon, SendIcon, UsersIcon } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { SUBSCRIPTION_STATUS_LABELS } from "@/components/billing/subscription-badge"
import {
  ChannelPicker,
  insertAtCursor,
  PlaceholderChips,
} from "@/components/messaging/channel-picker"
import {
  MerchantPicker,
  type PickedMerchant,
} from "@/components/messaging/merchant-picker"
import { PageHeader } from "@/components/page-header"
import { PaginationBar } from "@/components/pagination-bar"
import { Textarea } from "@/components/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ApiError } from "@/lib/api/client"
import {
  useAnnouncements,
  usePreviewAnnouncement,
  useSendAnnouncement,
  useTemplates,
} from "@/lib/api/queries"
import type {
  AnnouncementDraft,
  Audience,
  Channel,
  SubscriptionStatus,
} from "@/lib/api/types"
import { CHANNEL_LABELS, formatRelative } from "@/lib/format"

const AUDIENCES = [
  { value: "all", label: "All active merchants" },
  ...(["trial", "active", "due", "expired"] as SubscriptionStatus[]).map(
    (s) => ({ value: s, label: `${SUBSCRIPTION_STATUS_LABELS[s]} only` })
  ),
  { value: "merchants", label: "Specific merchants…" },
]

const audienceLabel = (a: Audience) =>
  a.type === "all"
    ? "All merchants"
    : a.type === "status"
      ? SUBSCRIPTION_STATUS_LABELS[a.status]
      : `${a.ids.length} merchant(s)`

export default function AnnouncementsPage() {
  const templates = useTemplates()
  const [templateId, setTemplateId] = React.useState<string>("custom")
  const [title, setTitle] = React.useState("")
  const [body, setBody] = React.useState("")
  const [sms, setSms] = React.useState("")
  const [channels, setChannels] = React.useState<Channel[]>(["inapp", "push"])
  const [audience, setAudience] = React.useState("all")
  const [picked, setPicked] = React.useState<PickedMerchant[]>([])
  const [confirming, setConfirming] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const lastField = React.useRef<{
    el: HTMLInputElement | HTMLTextAreaElement
    set: (v: string) => void
    value: string
  } | null>(null)

  const preview = usePreviewAnnouncement()
  const send = useSendAnnouncement()
  const history = useAnnouncements(page)

  const draft: AnnouncementDraft = {
    template_id: templateId === "custom" ? null : Number(templateId),
    title,
    body,
    sms_body: sms.trim() || null,
    channels,
    audience:
      audience === "all"
        ? { type: "all" }
        : audience === "merchants"
          ? { type: "merchants", ids: picked.map((m) => m.id) }
          : { type: "status", status: audience as SubscriptionStatus },
  }
  const noRecipients = audience === "merchants" && picked.length === 0

  function applyTemplate(id: string) {
    setTemplateId(id)
    const t = templates.data?.data.find((x) => String(x.id) === id)
    if (t) {
      setTitle(t.subject)
      setBody(t.body)
      setSms(t.sms_body ?? "")
      setChannels(t.channels)
    }
    preview.reset()
  }

  const track = (
    el: HTMLInputElement | HTMLTextAreaElement,
    set: (v: string) => void,
    value: string
  ) => {
    lastField.current = { el, set, value }
  }
  const err =
    send.error instanceof ApiError
      ? (Object.values(send.error.errors)[0]?.[0] ?? send.error.message)
      : send.error?.message
  const templateItems = [
    { value: "custom", label: "Write from scratch" },
    ...(templates.data?.data ?? []).map((t) => ({
      value: String(t.id),
      label: t.key ? `${t.name} (system)` : t.name,
    })),
  ]

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Message merchants in the app, by email and by SMS. Placeholders fill in per merchant."
      />

      <Card>
        <CardHeader>
          <CardTitle>New announcement</CardTitle>
          <CardDescription>
            Write in Amharic: merchants receive every message in Amharic. Email
            reaches merchants who have an email address; SMS goes through your
            Textbee gateway.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel>Template</FieldLabel>
                <Select
                  items={templateItems}
                  value={templateId}
                  onValueChange={(v) => v && applyTemplate(v)}
                >
                  <SelectTrigger className="w-full" aria-label="Template">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateItems.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Send to</FieldLabel>
                <Select
                  items={AUDIENCES}
                  value={audience}
                  onValueChange={(v) => v && (setAudience(v), preview.reset())}
                >
                  <SelectTrigger className="w-full" aria-label="Audience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {audience !== "merchants" && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto w-fit justify-start px-0"
                    onClick={() => (setAudience("merchants"), preview.reset())}
                  >
                    <UsersIcon data-icon="inline-start" />
                    Or choose specific merchants
                  </Button>
                )}
              </Field>
            </div>
            {audience === "merchants" && (
              <Field>
                <FieldLabel>
                  Merchants{" "}
                  <span className="font-normal text-muted-foreground">
                    ({picked.length} selected)
                  </span>
                </FieldLabel>
                <MerchantPicker
                  value={picked}
                  onChange={(v) => (setPicked(v), preview.reset())}
                />
              </Field>
            )}
            <Field>
              <FieldLabel>Channels</FieldLabel>
              <ChannelPicker value={channels} onChange={setChannels} />
            </Field>
            <Field>
              <FieldLabel htmlFor="ann-title">Title</FieldLabel>
              <Input
                id="ann-title"
                placeholder="ለምሳሌ፦ አዲስ ባህሪ በዱቤ"
                value={title}
                maxLength={150}
                onFocus={(e) => track(e.currentTarget, setTitle, title)}
                onChange={(e) => (
                  setTitle(e.target.value),
                  track(e.currentTarget, setTitle, e.target.value)
                )}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ann-body">Message</FieldLabel>
              <Textarea
                id="ann-body"
                placeholder="ሰላም {{owner_name}}፣ …"
                rows={4}
                value={body}
                onFocus={(e) => track(e.currentTarget, setBody, body)}
                onChange={(e) => (
                  setBody(e.target.value),
                  track(e.currentTarget, setBody, e.target.value)
                )}
              />
            </Field>
            {channels.includes("sms") && (
              <Field>
                <FieldLabel htmlFor="ann-sms">
                  SMS text (optional, shorter)
                </FieldLabel>
                <Textarea
                  id="ann-sms"
                  rows={2}
                  maxLength={320}
                  value={sms}
                  onFocus={(e) => track(e.currentTarget, setSms, sms)}
                  onChange={(e) => (
                    setSms(e.target.value),
                    track(e.currentTarget, setSms, e.target.value)
                  )}
                />
                <FieldDescription>
                  {sms.length}/320 · Amharic SMS parts hold 70 characters, so
                  long texts cost several SMS each.
                </FieldDescription>
              </Field>
            )}
            {templates.data && (
              <PlaceholderChips
                placeholders={templates.data.placeholders}
                onInsert={(token) => {
                  const f = lastField.current
                  if (!f) return setBody(body + token)
                  f.set(insertAtCursor(f.el, f.el.value, token))
                }}
              />
            )}
          </FieldGroup>

          {preview.data && (
            <div className="mt-4 space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="font-medium">
                {preview.data.recipient_count} recipient
                {preview.data.recipient_count === 1 ? "" : "s"}
                {preview.data.sample &&
                  ` · example for ${preview.data.sample.shop_name}:`}
              </p>
              {preview.data.sample && (
                <>
                  <p className="font-semibold">{preview.data.sample.title}</p>
                  <p className="whitespace-pre-line text-muted-foreground">
                    {preview.data.sample.body}
                  </p>
                  {channels.includes("sms") && (
                    <p className="text-xs">SMS: {preview.data.sample.sms}</p>
                  )}
                </>
              )}
            </div>
          )}
          {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={
                !title.trim() ||
                !body.trim() ||
                noRecipients ||
                preview.isPending
              }
              onClick={() => preview.mutate(draft)}
            >
              {preview.isPending ? (
                <Loader2Icon
                  className="animate-spin"
                  data-icon="inline-start"
                />
              ) : (
                <EyeIcon data-icon="inline-start" />
              )}
              Preview
            </Button>
            <Button
              disabled={!title.trim() || !body.trim() || noRecipients}
              onClick={() =>
                preview.mutate(draft, { onSuccess: () => setConfirming(true) })
              }
            >
              <SendIcon data-icon="inline-start" />
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 pb-0">
        <CardHeader className="pb-4">
          <CardTitle>Sent</CardTitle>
          <CardDescription>
            Including automatic messages (payment approved, trial ending …)
          </CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Message</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Channels</TableHead>
              <TableHead className="text-right">Recipients</TableHead>
              <TableHead className="text-right">Read</TableHead>
              <TableHead className="text-right">Push / SMS / email</TableHead>
              <TableHead className="pr-6">Sent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.data?.data.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="max-w-72 pl-6">
                  <div className="truncate font-medium">{a.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.kind === "system"
                      ? `Automatic · ${a.template?.name ?? ""}`
                      : (a.created_by ?? "")}
                  </div>
                </TableCell>
                <TableCell>{audienceLabel(a.audience)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {a.channels.map((c) => (
                      <Badge key={c} variant="outline">
                        {CHANNEL_LABELS[c]}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {a.recipient_count}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {a.read_count}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {a.push_sent} / {a.sms_sent} / {a.email_sent}
                  {a.failed_count > 0 && (
                    <span className="ml-1 text-destructive">
                      ({a.failed_count} failed)
                    </span>
                  )}
                </TableCell>
                <TableCell className="pr-6 whitespace-nowrap text-muted-foreground">
                  {a.sent_at ? formatRelative(a.sent_at) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <PaginationBar
        page={history.data}
        onPageChange={setPage}
        noun="announcements"
      />

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Send to {preview.data?.recipient_count ?? 0} merchants?
            </DialogTitle>
            <DialogDescription>
              Via {channels.map((c) => CHANNEL_LABELS[c]).join(", ")}.
              {channels.includes("sms") &&
                " SMS is sent from your Textbee gateway and costs airtime per message."}{" "}
              This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              disabled={send.isPending || !preview.data?.recipient_count}
              onClick={() =>
                send.mutate(draft, {
                  onSuccess: (r) => {
                    toast.success(`Sent to ${r.recipient_count} merchants`)
                    setConfirming(false)
                    preview.reset()
                    setTitle("")
                    setBody("")
                    setSms("")
                    setTemplateId("custom")
                  },
                })
              }
            >
              {send.isPending && (
                <Loader2Icon
                  className="animate-spin"
                  data-icon="inline-start"
                />
              )}
              Send now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
