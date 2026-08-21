"use client"

import { useState } from "react"
import { PencilIcon } from "lucide-react"
import { toast } from "sonner"

import { DocumentApiError, renameDocument } from "@/lib/documents/browser"
import { MAX_DOCUMENT_NAME_LENGTH } from "@/lib/pdf/constants"
import { cn } from "@/lib/utils"
import { useEditorStore } from "@/stores/editor-store"

type DocumentNameEditorProps = {
  documentId: string
  className?: string
}

export function DocumentNameEditor({
  documentId,
  className,
}: DocumentNameEditorProps) {
  const fileName = useEditorStore((state) => state.fileName)
  const [isEditing, setIsEditing] = useState(false)
  const [draftName, setDraftName] = useState("")

  function startEditing() {
    setDraftName(fileName)
    setIsEditing(true)
  }

  async function commit() {
    setIsEditing(false)

    const nextName = draftName.trim()

    if (!nextName || nextName === fileName) {
      return
    }

    const previousName = fileName
    const { setDocument } = useEditorStore.getState()

    // Optimistic: the toolbar and download filename update immediately and
    // roll back if the server rejects the rename.
    setDocument(documentId, nextName)

    try {
      const result = await renameDocument(documentId, nextName)
      setDocument(documentId, result.name)
      toast.success("Document renamed.")
    } catch (error) {
      console.error("Failed to rename document:", error)
      setDocument(documentId, previousName)
      toast.error(
        error instanceof DocumentApiError
          ? error.message
          : "The document could not be renamed."
      )
    }
  }

  if (isEditing) {
    return (
      <input
        autoFocus
        value={draftName}
        maxLength={MAX_DOCUMENT_NAME_LENGTH + 4}
        onChange={(event) => setDraftName(event.target.value)}
        onFocus={(event) => event.target.select()}
        onBlur={() => void commit()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            void commit()
          }

          if (event.key === "Escape") {
            event.preventDefault()
            setIsEditing(false)
          }
        }}
        aria-label="Document name"
        className={cn(
          "min-w-0 border-b border-foreground/40 bg-transparent text-sm font-medium outline-none focus-visible:border-foreground",
          className
        )}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      title="Rename document"
      className={cn(
        "group/name flex min-w-0 items-center gap-1.5 text-left text-sm font-medium",
        className
      )}
    >
      <span className="truncate">{fileName}</span>
      <PencilIcon
        aria-hidden="true"
        className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/name:opacity-100 group-focus-visible/name:opacity-100"
      />
      <span className="sr-only">Rename document</span>
    </button>
  )
}
