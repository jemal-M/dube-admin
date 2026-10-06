"use client"

import { ChevronRightIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { SubscriptionBadge } from "@/components/billing/subscription-badge"
import { CreateMerchantDialog } from "@/components/merchants/create-merchant-dialog"
import { StatusBadge } from "@/components/merchants/status-badge"
import { PageHeader } from "@/components/page-header"
import { PaginationBar } from "@/components/pagination-bar"
import { SearchInput } from "@/components/search-input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMerchants } from "@/lib/api/queries"
import { formatRelative } from "@/lib/format"
import { type MerchantStatusFilter, useFiltersStore } from "@/lib/stores/filters-store"

const STATUS_ITEMS: { value: MerchantStatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
]

export default function MerchantsPage() {
  const router = useRouter()
  const filters = useFiltersStore((s) => s.merchants)
  const setFilters = useFiltersStore((s) => s.setMerchantFilters)
  const setPage = useFiltersStore((s) => s.setMerchantPage)
  const { data, isPending, isError, error, isPlaceholderData } = useMerchants(filters)

  return (
    <>
      <PageHeader
        title="Merchants"
        description="Shop accounts on ዱቤ, their subscription and when their app was last active."
        actions={<CreateMerchantDialog />}
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={filters.search}
          onChange={(search) => setFilters({ search })}
          placeholder="Search shop, owner or email"
        />
        <Select
          items={STATUS_ITEMS}
          value={filters.status}
          onValueChange={(status) => status && setFilters({ status: status as MerchantStatusFilter })}
        >
          <SelectTrigger className="w-40" aria-label="Status">
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
              <TableHead>Owner</TableHead>
              <TableHead>Last active</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 6 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="px-4">
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {isError && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-destructive">
                  {error.message}
                </TableCell>
              </TableRow>
            )}
            {data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No merchants match these filters.
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((m) => {
              const href = `/merchants/view/?id=${m.id}`
              return (
                <TableRow key={m.id} className="cursor-pointer" onClick={() => router.push(href)}>
                  <TableCell className="pl-4 font-medium">
                    <Link href={href} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                      {m.shop_name ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.email}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatRelative(m.last_active_at)}</TableCell>
                  <TableCell>
                    <SubscriptionBadge status={m.subscription.status} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge active={m.is_active} />
                  </TableCell>
                  <TableCell>
                    <ChevronRightIcon className="size-4 text-muted-foreground" />
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
