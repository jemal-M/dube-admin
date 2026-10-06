"use client"

import { DownloadIcon, XIcon } from "lucide-react"
import Link from "next/link"

import { PageHeader } from "@/components/page-header"
import { PaginationBar } from "@/components/pagination-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMerchant, usePayments } from "@/lib/api/queries"
import type { Payment } from "@/lib/api/types"
import { formatCount, formatDate, formatMoney, PAYMENT_METHOD_LABELS } from "@/lib/format"
import { type PaymentMethodFilter, useFiltersStore } from "@/lib/stores/filters-store"

const METHOD_ITEMS: { value: PaymentMethodFilter; label: string }[] = [
  { value: "all", label: "All methods" },
  ...Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value: value as PaymentMethodFilter, label })),
]

function toCsv(rows: Payment[]): string {
  const cell = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const header = ["Paid on", "Shop", "Owner", "Amount (ETB)", "Months", "Period start", "Period end", "Method", "Reference", "Recorded by", "Note"]
  const lines = rows.map((p) =>
    [
      p.paid_on,
      p.merchant?.shop_name,
      p.merchant?.name,
      (p.amount / 100).toFixed(2),
      p.months,
      p.period_start.slice(0, 10),
      p.period_end.slice(0, 10),
      PAYMENT_METHOD_LABELS[p.method] ?? p.method,
      p.reference,
      p.recorded_by,
      p.note,
    ]
      .map(cell)
      .join(",")
  )
  return [header.map(cell).join(","), ...lines].join("\r\n")
}

function downloadCsv(rows: Payment[]) {
  // BOM so Excel opens Amharic shop names as UTF-8.
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement("a"), { href: url, download: `dube-payments-${new Date().toISOString().slice(0, 10)}.csv` })
  a.click()
  URL.revokeObjectURL(url)
}

export default function PaymentsPage() {
  const filters = useFiltersStore((s) => s.payments)
  const setFilters = useFiltersStore((s) => s.setPaymentFilters)
  const setPage = useFiltersStore((s) => s.setPaymentPage)
  const { data, isPending, isError, error, isPlaceholderData } = usePayments(filters)
  const merchant = useMerchant(filters.merchantId)
  const hasFilters = filters.method !== "all" || filters.from !== "" || filters.to !== "" || filters.merchantId !== null

  return (
    <>
      <PageHeader
        title="Payments"
        description="Every subscription payment recorded by an admin."
        actions={
          <Button variant="outline" disabled={!data?.data.length} onClick={() => data && downloadCsv(data.data)}>
            <DownloadIcon data-icon="inline-start" />
            Export page (CSV)
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardDescription>{hasFilters ? "Collected (filtered)" : "Collected, all time"}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {data ? formatMoney(data.totals.amount) : <Skeleton className="h-7 w-28" />}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Payments</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {data ? formatCount(data.totals.count) : <Skeleton className="h-7 w-12" />}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Subscription months sold</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {data ? formatCount(data.totals.months) : <Skeleton className="h-7 w-12" />}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Select
          items={METHOD_ITEMS}
          value={filters.method}
          onValueChange={(method) => method && setFilters({ method: method as PaymentMethodFilter })}
        >
          <SelectTrigger className="w-44" aria-label="Payment method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METHOD_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          From
          <Input type="date" className="w-40" value={filters.from} max={filters.to || undefined} onChange={(e) => setFilters({ from: e.target.value })} />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          To
          <Input type="date" className="w-40" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilters({ to: e.target.value })} />
        </label>
        {filters.merchantId !== null && (
          <Badge variant="secondary" className="h-8 gap-1 pr-1 pl-3 text-sm">
            {merchant.data?.shop_name ?? merchant.data?.name ?? `Merchant #${filters.merchantId}`}
            <Button variant="ghost" size="icon-xs" aria-label="Clear merchant filter" onClick={() => setFilters({ merchantId: null })}>
              <XIcon />
            </Button>
          </Badge>
        )}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => setFilters({ method: "all", from: "", to: "", merchantId: null })}>
            Clear filters
          </Button>
        )}
      </div>

      <Card className="py-0">
        <Table className={isPlaceholderData ? "opacity-60 transition-opacity" : undefined}>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Paid on</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Covers</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="pr-4">Recorded by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 8 }, (_, i) => (
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
                  No payments match these filters.
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="pl-4 whitespace-nowrap">{formatDate(p.paid_on)}</TableCell>
                <TableCell>
                  {p.merchant && (
                    <Link href={`/merchants/view/?id=${p.merchant.id}`} className="hover:underline">
                      {p.merchant.shop_name ?? p.merchant.name}
                    </Link>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">{formatMoney(p.amount)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {p.months === 1 ? "1 month" : `${p.months} months`}
                  <div className="text-xs text-muted-foreground">
                    {formatDate(p.period_start)} – {formatDate(p.period_end)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{p.reference ?? "—"}</TableCell>
                <TableCell className="pr-4 text-muted-foreground">{p.recorded_by ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <PaginationBar page={data} onPageChange={setPage} noun="payments" />
    </>
  )
}
