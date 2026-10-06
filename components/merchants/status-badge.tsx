import { Badge } from "@/components/ui/badge"

export function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge variant="secondary">
      <span className="size-1.5 rounded-full bg-primary" aria-hidden />
      Active
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      <span className="size-1.5 rounded-full bg-muted-foreground" aria-hidden />
      Suspended
    </Badge>
  )
}
