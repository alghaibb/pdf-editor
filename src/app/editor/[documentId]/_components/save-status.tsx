"use client"

import { useEditorStore, type EditorSaveStatus } from "@/stores/editor-store"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<EditorSaveStatus, string> = {
  saved: "Saved",
  unsaved: "Unsaved changes",
  saving: "Saving...",
  failed: "Save failed",
}

const COMPACT_STATUS_LABEL: Record<EditorSaveStatus, string> = {
  saved: "Saved",
  unsaved: "Unsaved",
  saving: "Saving",
  failed: "Failed",
}

type SaveStatusProps = {
  className?: string
  compact?: boolean
}

export function SaveStatus({ className, compact = false }: SaveStatusProps) {
  const saveStatus = useEditorStore((state) => state.saveStatus)
  const labels = compact ? COMPACT_STATUS_LABEL : STATUS_LABEL

  return (
    <p
      className={cn(
        "text-xs font-semibold tracking-widest text-muted-foreground uppercase",
        className
      )}
      aria-live="polite"
    >
      {labels[saveStatus]}
    </p>
  )
}
