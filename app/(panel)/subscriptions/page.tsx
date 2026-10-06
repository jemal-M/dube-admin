"use client"

import Link from "next/link"

import { RecordPaymentDialog } from "@/components/billing/record-payment-dialog"
import { SUBSCRIPTION_STATUS_LABELS, SubscriptionBadge } from "@/components/billing/subscription-badge"
import { PageHeader } from "@/components/page-header"
import { PaginationBar } from "@/components/pagination-bar"
import { SearchInput } from "@/components/search-input"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useStats, useSubscriptions } from "@/lib/api/queries"
import type { SubscriptionStatus } from "@/lib/api/types"
import { formatDate, formatDueIn, formatMoney, formatPhone } from "@/lib/format"
import { type SubscriptionStatusFilter, useFiltersStore } from "@/lib/stores/filters-store"
import { cn } from "@/lib/utils"

const STATUSES: SubscriptionStatus[] = ["expired", "due", "trial", "active"]
const STATUS_ITEMS: { value: SubscriptionStatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  ...STATUSES.map((s) => ({ value: s, label: SUBSCRIPTION_STATUS_LABELS[s] })),
]

export default function SubscriptionsPage() {
  const filters = useFiltersStore((s) => s.subscriptions)
  const setFilters = useFiltersStore((s) => s.setSubscriptionFilters)
  const setPage = useFiltersStore((s) => s.setSubscriptionPage)
  const { data, isPending, isError, error, isPlaceholderData } = useSubscriptions(filters)
  const stats = useStats()
  const counts = stats.data?.subscriptions

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Who is paid up, who is in the grace period, and whose sync is blocked."
      />

      {/* Status tiles double as filters: click to show only that group. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilters({ status: filters.status === s ? "all" : s })}
            aria-pressed={filters.status === s}
            className="text-left"
          >
            <Card
              size="sm"
              className={cn(
                "h-full transition-colors hover:border-primary/40",
                filters.status === s && "border-primary ring-1 ring-primary/30"
              )}
            >
              <CardHeader>
                <CardDescription>
                  <SubscriptionBadge status={s} />
                </CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {counts ? counts[s] : <Skeleton className="h-7 w-10" />}
                </CardTitle>
              </CardHeader>
            </Card>
          </button>
        ))}
        <Card size="sm" className="col-span-2 lg:col-span-1">
          <CardHeader>
            <CardDescription>Revenue, last 30 days</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {counts ? formatMoney(counts.revenue_30d) : <Skeleton className="h-7 w-24" />}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={filters.search}
          onChange={(search) => setFilters({ search })}
          placeholder="Search shop, owner or phone"
        />
        <Select
          items={STATUS_ITEMS}
          value={filters.status}
          onValueChange={(status) => status && setFilters({ status: status as SubscriptionStatusFilter })}
        >
          <SelectTrigger className="w-44" aria-label="Subscription status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="py-0">
        <Table className={isPlaceholderData ? "opacity-60 transition-opacity" : undefined}>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Shop</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Paid until</TableHead>
              <TableHead className="text-right">Monthly fee</TableHead>
              <TableHead>Last payment</TableHead>
              <TableHead className="text-right">Total paid</TableHead>
              <TableHead className="pr-4 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 6 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="px-4">
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {isError && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-destructive">
                  {error.message}
                </TableCell>
              </TableRow>
            )}
            {data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No merchants match these filters.
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((m) => {
              const sub = m.subscription
              const overdue = sub.status === "due" || sub.status === "expired"
              return (
                <TableRow key={m.id}>
                  <TableCell className="pl-4">
                    <Link href={`/merchants/view/?id=${m.id}`} className="font-medium hover:underline">
                      {m.shop_name ?? m.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {m.name}
                      {m.phone && ` · ${formatPhone(m.phone)}`}
                      {!m.is_active && " · suspended"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <SubscriptionBadge status={sub.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {sub.ends_at ? formatDate(sub.ends_at) : "—"}
                    <div className={cn("text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>
                      {sub.status === "due" && sub.grace_ends_at
                        ? `sync stops ${formatDueIn(sub.grace_ends_at)}`
                        : formatDueIn(sub.ends_at)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {formatMoney(sub.monthly_fee)}
                    {m.monthly_fee_is_custom && <div className="text-xs text-muted-foreground">custom</div>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {m.last_paid_on ? formatDate(m.last_paid_on) : "Never"}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">{formatMoney(m.total_paid)}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <RecordPaymentDialog merchant={m} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <PaginationBar page={data} onPageChange={setPage} noun="merchants" />
    </>
  )
}
