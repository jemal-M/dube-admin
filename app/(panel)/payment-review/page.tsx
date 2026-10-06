"use client"

import { CheckIcon, ImageIcon, Loader2Icon, XIcon } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"

import { SubscriptionBadge } from "@/components/billing/subscription-badge"
import { PageHeader } from "@/components/page-header"
import { PaginationBar } from "@/components/pagination-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchBlobUrl } from "@/lib/api/client"
import { usePaymentRequests, useReviewPaymentRequest } from "@/lib/api/queries"
import type { PaymentRequestRow, PaymentRequestStatus } from "@/lib/api/types"
import { formatDate, formatMoney, formatPhone, formatRelative } from "@/lib/format"
import { cn } from "@/lib/utils"

const TABS: { value: PaymentRequestStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
]

const QUICK_REASONS = ["Amount does not match", "Payment not received", "Receipt is unreadable", "Wrong account"]

export default function PaymentReviewPage() {
  const [status, setStatus] = React.useState<PaymentRequestStatus | "all">("pending")
  const [page, setPage] = React.useState(1)
  const { data, isPending } = usePaymentRequests(status, page)

  return (
    <>
      <PageHeader
        title="Payment review"
        description="Merchants pay to your accounts, then send the receipt or transaction ID. Check it against your statement, then approve."
      />
      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <Button
            key={t.value}
            role="tab"
            aria-selected={status === t.value}
            variant={status === t.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatus(t.value)
              setPage(1)
            }}
          >
            {t.label}
            {t.value === "pending" && !!data?.pending_count && (
              <span className="ml-1 rounded-full bg-background/20 px-1.5 text-xs">{data.pending_count}</span>
            )}
          </Button>
        ))}
      </div>
      {isPending && <Skeleton className="h-40 w-full" />}
      {data?.data.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {status === "pending" ? "Nothing waiting for review." : "No requests here."}
          </CardContent>
        </Card>
      )}
      <div className="space-y-3">
        {data?.data.map((r) => (
          <RequestCard key={r.id} request={r} />
        ))}
      </div>
      <PaginationBar page={data} onPageChange={setPage} noun="requests" />
    </>
  )
}

function Screenshot({ id }: { id: number }) {
  const [url, setUrl] = React.useState<string | null>(null)
  const [failed, setFailed] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    let revoke: string | null = null
    fetchBlobUrl(`admin/payment-requests/${id}/screenshot`)
      .then((u) => {
        revoke = u
        setUrl(u)
      })
      .catch(() => setFailed(true))
    return () => {
      if (revoke) URL.revokeObjectURL(revoke)
    }
  }, [id])

  if (failed) return <div className="flex size-24 items-center justify-center rounded-lg border text-xs text-muted-foreground">No image</div>
  if (!url) return <Skeleton className="size-24 rounded-lg" />
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="overflow-hidden rounded-lg border" aria-label="Open receipt">
        {/* eslint-disable-next-line @next/next/no-img-element -- authenticated blob URL, not optimisable */}
        <img src={url} alt="Payment receipt" className="size-24 object-cover" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
          </DialogHeader>
          {/* eslint-disable-next-line @next/next/no-img-element -- authenticated blob URL */}
          <img src={url} alt="Payment receipt, full size" className="max-h-[75vh] w-full rounded-lg object-contain" />
        </DialogContent>
      </Dialog>
    </>
  )
}

function RequestCard({ request: r }: { request: PaymentRequestRow }) {
  const review = useReviewPaymentRequest()
  const [rejecting, setRejecting] = React.useState(false)
  const [reason, setReason] = React.useState("")
  const m = r.merchant

  const act = (action: "approve" | "reject", why?: string) =>
    review.mutate(
      { id: r.id, action, reason: why },
      {
        onSuccess: () => {
          toast.success(action === "approve" ? `Approved — ${m?.shop_name ?? m?.name} is active` : "Rejected; the merchant was notified")
          setRejecting(false)
        },
        onError: (e) => toast.error(e.message),
      }
    )

  return (
    <Card className={cn(r.status === "pending" && "border-primary/30")}>
      <CardContent className="flex flex-wrap items-start gap-4">
        {r.has_screenshot ? (
          <Screenshot id={r.id} />
        ) : (
          <div className="flex size-24 flex-col items-center justify-center gap-1 rounded-lg border text-xs text-muted-foreground">
            <ImageIcon className="size-5" />
            No receipt
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {m && (
              <Link href={`/merchants/view/?id=${m.id}`} className="font-semibold hover:underline">
                {m.shop_name ?? m.name}
              </Link>
            )}
            {m && <SubscriptionBadge status={m.subscription.status} />}
            <Badge variant={r.status === "pending" ? "default" : "outline"} className="capitalize">
              {r.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {m?.name}
            {m?.phone && ` · ${formatPhone(m.phone)}`} · submitted {formatRelative(r.created_at)}
          </p>
          <p className="text-sm">
            <span className="text-lg font-semibold tabular-nums">{formatMoney(r.amount)}</span> · {r.plan?.name} ·{" "}
            {r.months === 1 ? "1 month" : `${r.months} months`} · to {r.account?.label ?? "—"}{" "}
            <span className="font-mono text-xs text-muted-foreground">{r.account?.account_number}</span>
          </p>
          <p className="text-sm">
            Reference: <span className="font-mono">{r.reference ?? "—"}</span>
          </p>
          {r.status === "rejected" && r.rejection_reason && <p className="text-sm text-destructive">Rejected: {r.rejection_reason}</p>}
          {r.reviewed_at && (
            <p className="text-xs text-muted-foreground">
              Reviewed {formatDate(r.reviewed_at)}
              {r.reviewed_by && ` by ${r.reviewed_by}`}
            </p>
          )}
        </div>
        {r.status === "pending" && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setRejecting(true)} disabled={review.isPending}>
              <XIcon data-icon="inline-start" />
              Reject
            </Button>
            <Button onClick={() => act("approve")} disabled={review.isPending}>
              {review.isPending ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
              Approve
            </Button>
          </div>
        )}
      </CardContent>

      <Dialog open={rejecting} onOpenChange={setRejecting}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject payment</DialogTitle>
            <DialogDescription>The merchant gets this reason and can submit again.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {QUICK_REASONS.map((q) => (
              <Button key={q} size="xs" variant={reason === q ? "secondary" : "outline"} onClick={() => setReason(q)}>
                {q}
              </Button>
            ))}
          </div>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" maxLength={255} />
          <DialogFooter>
            <Button variant="destructive" disabled={!reason.trim() || review.isPending} onClick={() => act("reject", reason.trim())}>
              Reject payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
