"use client"

import { format } from "date-fns"

type DocumentUpdatedAtProps = {
  value: string
}

export function DocumentUpdatedAt({ value }: DocumentUpdatedAtProps) {
  const formatted = format(new Date(value), "dd/MM/yyyy h:mm a")

  return (
    <p className="mt-2 truncate text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
      Updated {formatted}
    </p>
  )
}
