"use client"

import { useEditorStore, type EditorSaveStatus } from "@/stores/editor-store"

const STATUS_LABEL: Record<EditorSaveStatus, string> = {
  saved: "Saved",
  unsaved: "Unsaved changes",
  saving: "Saving...",
  failed: "Save failed",
}

export function SaveStatus() {
  const saveStatus = useEditorStore((state) => state.saveStatus)

  return (
    <p
      className="text-xs font-semibold tracking-widest text-muted-foreground uppercase"
      aria-live="polite"
    >
      {STATUS_LABEL[saveStatus]}
    </p>
  )
}
