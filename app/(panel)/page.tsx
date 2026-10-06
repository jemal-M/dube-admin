"use client"

import { ArrowRightIcon } from "lucide-react"
import Link from "next/link"

import { SubscriptionBadge } from "@/components/billing/subscription-badge"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { StatTile } from "@/components/dashboard/stat-tile"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useStats } from "@/lib/api/queries"
import { formatCount, formatMoney, moneyParts } from "@/lib/format"

/** Platform view: accounts, subscriptions and revenue. Merchants' books are private to them. */
export default function DashboardPage() {
  const { data: stats, isPending, isError, error } = useStats()
  const subs = stats?.subscriptions

  const revenueDelta =
    subs &&
    (subs.revenue_prev_30d === 0
      ? subs.revenue_30d > 0
        ? Infinity
        : 0
      : ((subs.revenue_30d - subs.revenue_prev_30d) / subs.revenue_prev_30d) * 100)

  return (
    <>
      <PageHeader title="Dashboard" description="Merchant accounts, subscriptions and platform revenue." />

      {isError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Could not load stats: {error.message}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <StatTile
          hero
          label="Revenue, last 30 days"
          value={subs && <HeroMoney minor={subs.revenue_30d} />}
          delta={revenueDelta !== undefined ? { value: revenueDelta, period: "previous 30 days" } : null}
          loading={isPending}
        />
        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2">
          <StatTile
            label="Active merchants"
            value={stats && formatCount(stats.merchants_active)}
            footnote={stats && `${formatCount(stats.merchants_total - stats.merchants_active)} suspended`}
            loading={isPending}
          />
          <StatTile label="New merchants, 30 days" value={stats && formatCount(stats.merchants_new_30d)} loading={isPending} />
          <StatTile label="Revenue, all time" value={subs && formatMoney(subs.revenue_total)} loading={isPending} />
        </div>
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>Where every merchant stands on billing</CardDescription>
          <CardAction>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/subscriptions/" />}>
              Manage
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-x-6 gap-y-2">
          {(["active", "trial", "due", "expired"] as const).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <SubscriptionBadge status={s} />
              <span className="text-lg font-semibold tabular-nums">{subs ? subs[s] : "–"}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <RevenueChart data={stats?.revenue_monthly} loading={isPending} />
    </>
  )
}

function HeroMoney({ minor }: { minor: number }) {
  const { currency, amount } = moneyParts(minor)
  return (
    <span className="whitespace-nowrap">
      <span className="mr-2 align-baseline text-xl font-medium text-muted-foreground">{currency}</span>
      {amount}
    </span>
  )
}
