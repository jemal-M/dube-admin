import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Paginated } from "@/lib/api/types"

export function PaginationBar({
  page,
  onPageChange,
  noun = "results",
}: {
  page: Pick<Paginated<unknown>, "current_page" | "last_page" | "total" | "from" | "to"> | undefined
  onPageChange: (page: number) => void
  noun?: string
}) {
  if (!page || page.total === 0) return null

  return (
    <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
      <span>
        {page.from}–{page.to} of {page.total.toLocaleString()} {noun}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page.current_page <= 1}
          onClick={() => onPageChange(page.current_page - 1)}
        >
          <ChevronLeftIcon data-icon="inline-start" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page.current_page >= page.last_page}
          onClick={() => onPageChange(page.current_page + 1)}
        >
          Next
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
