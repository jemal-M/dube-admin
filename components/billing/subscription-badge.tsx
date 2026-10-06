import { CircleAlertIcon, CircleCheckIcon, CircleXIcon, SparklesIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { SubscriptionStatus } from "@/lib/api/types"
import { cn } from "@/lib/utils"

/** Status always carries an icon and a word, never colour alone. */
const STATUS: Record<SubscriptionStatus, { label: string; icon: typeof CircleCheckIcon; className: string }> = {
  active: { label: "Active", icon: CircleCheckIcon, className: "bg-primary/10 text-primary" },
  trial: { label: "Trial", icon: SparklesIcon, className: "bg-secondary text-secondary-foreground" },
  due: {
    label: "Payment due",
    icon: CircleAlertIcon,
    className: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
  },
  expired: { label: "Expired", icon: CircleXIcon, className: "bg-destructive/10 text-destructive" },
}

export const SUBSCRIPTION_STATUS_LABELS = Object.fromEntries(
  Object.entries(STATUS).map(([k, v]) => [k, v.label])
) as Record<SubscriptionStatus, string>

export function SubscriptionBadge({ status, className }: { status: SubscriptionStatus; className?: string }) {
  const { label, icon: Icon, className: tone } = STATUS[status]
  return (
    <Badge variant="secondary" className={cn("gap-1 border-transparent", tone, className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </Badge>
  )
}
