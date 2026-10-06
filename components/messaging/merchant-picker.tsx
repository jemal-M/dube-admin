"use client"

import * as React from "react"
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useMerchants } from "@/lib/api/queries"
import { SUBSCRIPTION_STATUS_LABELS } from "@/components/billing/subscription-badge"
import { cn } from "@/lib/utils"

export type PickedMerchant = { id: number; label: string }

/** Search merchants by shop, name or phone and tick the ones to message. */
export function MerchantPicker({
  value,
  onChange,
}: {
  value: PickedMerchant[]
  onChange: (v: PickedMerchant[]) => void
}) {
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const deferred = React.useDeferredValue(search)
  const merchants = useMerchants({ search: deferred, status: "all", page })
  const selected = new Set(value.map((m) => m.id))
  const rows = merchants.data?.data ?? []

  const toggle = (id: number, label: string) =>
    onChange(
      selected.has(id)
        ? value.filter((m) => m.id !== id)
        : [...value, { id, label }]
    )
  const pageAll = rows.filter((m) => m.is_active)
  const allOnPage =
    pageAll.length > 0 && pageAll.every((m) => selected.has(m.id))

  return (
    <div className="rounded-lg border">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b p-2">
          {value.map((m) => (
            <Badge key={m.id} variant="secondary" className="gap-1 pr-1">
              {m.label}
              <button
                type="button"
                aria-label={`Remove ${m.label}`}
                className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
                onClick={() => onChange(value.filter((x) => x.id !== m.id))}
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="xs"
            className="ml-auto"
            onClick={() => onChange([])}
          >
            Clear all
          </Button>
        </div>
      )}
      <div className="flex items-center gap-2 border-b p-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search shop, owner or phone"
            value={search}
            onChange={(e) => (setSearch(e.target.value), setPage(1))}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={pageAll.length === 0}
          onClick={() =>
            onChange(
              allOnPage
                ? value.filter((m) => !pageAll.some((r) => r.id === m.id))
                : [
                    ...value,
                    ...pageAll
                      .filter((r) => !selected.has(r.id))
                      .map((r) => ({ id: r.id, label: r.shop_name ?? r.name })),
                  ]
            )
          }
        >
          {allOnPage ? "Unselect page" : "Select page"}
        </Button>
      </div>
      <ul className="max-h-72 overflow-y-auto">
        {rows.map((m) => {
          const on = selected.has(m.id)
          const label = m.shop_name ?? m.name
          return (
            <li key={m.id}>
              <button
                type="button"
                disabled={!m.is_active}
                aria-pressed={on}
                onClick={() => toggle(m.id, label)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50",
                  on && "bg-primary/5"
                )}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input"
                  )}
                >
                  {on && <CheckIcon className="size-3" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{label}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {m.name} · {m.phone ?? m.email ?? "—"}
                  </span>
                </span>
                <Badge variant="outline">
                  {m.is_active
                    ? SUBSCRIPTION_STATUS_LABELS[m.subscription.status]
                    : "Disabled"}
                </Badge>
              </button>
            </li>
          )
        })}
        {merchants.data && rows.length === 0 && (
          <li className="p-4 text-center text-sm text-muted-foreground">
            No merchants found.
          </li>
        )}
        {!merchants.data && (
          <li className="p-4 text-center text-sm text-muted-foreground">
            Loading…
          </li>
        )}
      </ul>
      {merchants.data && merchants.data.last_page > 1 && (
        <div className="flex items-center justify-between border-t px-3 py-1.5 text-xs text-muted-foreground">
          <span>
            {merchants.data.from}–{merchants.data.to} of {merchants.data.total}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Next page"
              disabled={page >= merchants.data.last_page}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
