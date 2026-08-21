"use client"

import { useSyncExternalStore } from "react"
import { format } from "date-fns"

type DocumentUpdatedAtProps = {
  value: string
}

const emptySubscribe = () => () => {}

/**
 * False during SSR and the hydration render, true right after. Lets the
 * timezone-dependent label render only on the client without a mismatch.
 */
function useIsHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

/**
 * Derived from the ISO string with no timezone math, so the server and the
 * client's hydration render always produce identical text. Formatting with
 * the viewer's timezone during SSR caused a hydration mismatch, which made
 * React re-render the dashboard tree on every load.
 */
function utcDateLabel(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-")
  return `${day}/${month}/${year}`
}

export function DocumentUpdatedAt({ value }: DocumentUpdatedAtProps) {
  const isHydrated = useIsHydrated()
  const label = isHydrated
    ? format(new Date(value), "dd/MM/yyyy h:mm a")
    : utcDateLabel(value)

  return (
    <p className="mt-2 truncate text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
      Updated {label}
    </p>
  )
}
