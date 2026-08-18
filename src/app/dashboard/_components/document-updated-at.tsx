"use client"

import { format } from "date-fns"

type DocumentUpdatedAtProps = {
  value: string
}

export function DocumentUpdatedAt({ value }: DocumentUpdatedAtProps) {
  const formatted = format(new Date(value), "dd/MM/yyyy h:mm a")

  return (
    <p className="truncate text-xs text-muted-foreground">
      Updated {formatted}
    </p>
  )
}
