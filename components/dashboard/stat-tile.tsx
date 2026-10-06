import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react"
import * as React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/** Stat tile contract: label · value · optional delta vs a named period · optional footnote. */
export function StatTile({
  label,
  value,
  delta,
  footnote,
  hero = false,
  loading = false,
  className,
}: {
  label: string
  value: React.ReactNode
  delta?: { value: number; period: string } | null
  footnote?: React.ReactNode
  hero?: boolean
  loading?: boolean
  className?: string
}) {
  return (
    <Card className={cn(hero && "border-primary/25 bg-gradient-to-br from-primary/[0.06] to-transparent", className)}>
      <CardHeader className="gap-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className={cn(
            "font-semibold tracking-tight tabular-nums",
            hero ? "text-4xl text-primary 2xl:text-5xl" : "text-2xl"
          )}
        >
          {loading ? <Skeleton className={cn(hero ? "h-12 w-56" : "h-8 w-28")} /> : value}
        </CardTitle>
      </CardHeader>
      {(delta || footnote) && !loading && (
        <CardContent className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {delta && <Delta {...delta} />}
          {footnote}
        </CardContent>
      )}
    </Card>
  )
}

/** Direction is shown by icon + sign + words, never by colour alone. */
function Delta({ value, period }: { value: number; period: string }) {
  if (!Number.isFinite(value)) return <span>New vs {period}</span>
  const up = value >= 0
  const Icon = up ? ArrowUpRightIcon : ArrowDownRightIcon
  return (
    <span className="inline-flex items-center gap-1 font-medium text-foreground">
      <Icon className="size-3.5" aria-hidden />
      {up ? "+" : "−"}
      {Math.abs(value).toFixed(1)}%<span className="font-normal text-muted-foreground">vs {period}</span>
    </span>
  )
}
