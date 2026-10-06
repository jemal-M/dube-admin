"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatMoney } from "@/lib/format"

// Single series: the title names it, so no legend. --chart-1 is the validated burgundy.
const config = { revenue: { label: "Revenue", color: "var(--chart-1)" } } satisfies ChartConfig

const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit" })
const birrTick = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })

export function RevenueChart({ data, loading }: { data: { month: string; amount: number }[] | undefined; loading: boolean }) {
  const [view, setView] = React.useState<"chart" | "table">("chart")
  const rows = React.useMemo(
    () =>
      (data ?? []).map((d) => ({
        month: monthLabel.format(new Date(`${d.month}-01T00:00:00`)),
        revenue: d.amount / 100,
        minor: d.amount,
      })),
    [data]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription revenue</CardTitle>
        <CardDescription>Payments recorded per month, last 6 months</CardDescription>
        <CardAction>
          <div className="flex rounded-lg border p-0.5" role="group" aria-label="View">
            {(["chart", "table"] as const).map((v) => (
              <Button
                key={v}
                size="xs"
                variant={view === v ? "secondary" : "ghost"}
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className="capitalize"
              >
                {v}
              </Button>
            ))}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : view === "chart" ? (
          <ChartContainer config={config} className="aspect-auto h-64 w-full">
            <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => birrTick.format(v)} />
              <ChartTooltip
                cursor={{ fillOpacity: 0.4 }}
                content={<ChartTooltipContent hideIndicator formatter={(_, __, item) => formatMoney(item.payload.minor)} />}
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...rows].reverse().map((r) => (
                  <TableRow key={r.month}>
                    <TableCell>{r.month}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(r.minor)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
