"use client"

import { SearchIcon } from "lucide-react"
import * as React from "react"

import { Input } from "@/components/ui/input"

/** Debounced search box: types locally, commits to the caller after 300ms of quiet. */
export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const [draft, setDraft] = React.useState(value)
  const [committed, setCommitted] = React.useState(value)

  // Adopt external resets (e.g. filters cleared elsewhere) during render, not in an effect.
  if (value !== committed) {
    setCommitted(value)
    setDraft(value)
  }

  React.useEffect(() => {
    if (draft === value) return
    const t = setTimeout(() => onChange(draft.trim()), 300)
    return () => clearTimeout(t)
  }, [draft, value, onChange])

  return (
    <div className="relative w-full sm:w-72">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-8"
      />
    </div>
  )
}
