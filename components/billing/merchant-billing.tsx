"use client"

import { ArrowRightIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"

import { MonthlyFeeDialog } from "@/components/billing/monthly-fee-dialog"
import { RecordPaymentDialog } from "@/components/billing/record-payment-dialog"
import { SubscriptionBadge } from "@/components/billing/subscription-badge"
import { PaginationBar } from "@/components/pagination-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMerchantPayments } from "@/lib/api/queries"
import type { Merchant } from "@/lib/api/types"
import { formatDate, formatDueIn, formatMoney, PAYMENT_METHOD_LABELS } from "@/lib/format"
import { useFiltersStore } from "@/lib/stores/filters-store"
import { cn } from "@/lib/utils"

/** Subscription status, price and payment history for one merchant. */
export function MerchantBilling({ merchant }: { merchant: Merchant }) {
  const router = useRouter()
  const [page, setPage] = React.useState(1)
  const payments = useMerchantPayments(merchant.id, page)
  const showAllPayments = useFiltersStore((s) => s.setPaymentFilters)
  const sub = merchant.subscription
  const overdue = sub.status === "due" || sub.status === "expired"

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className={cn(overdue && "border-destructive/40")}>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardAction>
            <SubscriptionBadge status={sub.status} />
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            <dt className="text-muted-foreground">{sub.status === "trial" ? "Trial ends" : "Paid until"}</dt>
            <dd>
              {sub.ends_at ? formatDate(sub.ends_at) : "—"}{" "}
              <span className={cn("text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>
                ({formatDueIn(sub.ends_at)})
              </span>
            </dd>
            {sub.status === "due" && sub.grace_ends_at && (
              <>
                <dt className="text-muted-foreground">Sync stops</dt>
                <dd className="text-destructive">
                  {formatDate(sub.grace_ends_at)} ({formatDueIn(sub.grace_ends_at)})
                </dd>
              </>
            )}
            <dt className="text-muted-foreground">Monthly fee</dt>
            <dd className="flex items-center gap-1">
              {formatMoney(sub.monthly_fee)}
              <MonthlyFeeDialog merchantId={merchant.id} currentFee={sub.monthly_fee} />
            </dd>
          </dl>
          {sub.status === "expired" && (
            <p className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
              Sync is blocked. The merchant keeps working offline; entries upload as soon as a payment is recorded.
            </p>
          )}
          <RecordPaymentDialog merchant={merchant} trigger={<Button className="w-full" />} />
        </CardContent>
      </Card>

      <Card className="gap-0 pb-0 lg:col-span-2">
        <CardHeader className="pb-4">
          <CardTitle>Payment history</CardTitle>
          <CardDescription>Recorded by admins; newest first</CardDescription>
          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                showAllPayments({ merchantId: merchant.id, method: "all", from: "", to: "" })
                router.push("/payments/")
              }}
            >
              All payments
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </CardAction>
        </CardHeader>
        <Table className={payments.isPlaceholderData ? "opacity-60" : undefined}>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Paid on</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Covers</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="pr-6">Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.isPending && (
              <TableRow>
                <TableCell colSpan={5} className="px-6">
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            )}
            {payments.data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No payments yet{sub.status === "trial" ? " — still on the free trial." : "."}
                </TableCell>
              </TableRow>
            )}
            {payments.data?.data.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="pl-6 whitespace-nowrap">{formatDate(p.paid_on)}</TableCell>
                <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">{formatMoney(p.amount)}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(p.period_start)} – {formatDate(p.period_end)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</Badge>
                </TableCell>
                <TableCell className="pr-6 font-mono text-xs">{p.reference ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {payments.data && payments.data.last_page > 1 && (
          <div className="border-t px-6 py-3">
            <PaginationBar page={payments.data} onPageChange={setPage} noun="payments" />
          </div>
        )}
      </Card>
    </div>
  )
}
