"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { MAX_DOCUMENT_NAME_LENGTH } from "@/lib/pdf/constants"
import { sanitizeDocumentName } from "@/lib/pdf/name"

type DocumentNameProps = {
  name: string
  onRename: (name: string) => void
}

export function DocumentName({ name, onRename }: DocumentNameProps) {
  const closedRef = useRef(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(name)

  function startEditing() {
    closedRef.current = false
    setDraft(name)
    setIsEditing(true)
  }

  function cancel() {
    closedRef.current = true
    setDraft(name)
    setIsEditing(false)
  }

  function commit() {
    if (closedRef.current) {
      return
    }

    const nextName = sanitizeDocumentName(draft)

    if (draft.trim().length === 0) {
      toast.error("Enter a document name.")
      cancel()
      return
    }

    closedRef.current = true
    setIsEditing(false)

    if (nextName === name) {
      setDraft(name)
      return
    }

    setDraft(nextName)
    onRename(nextName)
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        className="font-heading min-w-0 max-w-full overflow-hidden py-[0.12em] pr-[0.28em] text-left text-2xl leading-snug font-semibold tracking-tight text-ellipsis whitespace-nowrap underline-offset-4 hover:underline sm:text-3xl"
        aria-label={`Rename ${name}`}
        title="Rename"
        onClick={startEditing}
      >
        {name}
      </button>
    )
  }

  return (
    <Input
      autoFocus
      value={draft}
      maxLength={MAX_DOCUMENT_NAME_LENGTH}
      aria-label="Document name"
      className="font-heading h-12 text-2xl font-semibold tracking-tight md:h-14 md:text-3xl"
      onChange={(event) => setDraft(event.target.value)}
      onFocus={(event) => event.currentTarget.select()}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault()
          commit()
        }

        if (event.key === "Escape") {
          event.preventDefault()
          cancel()
        }
      }}
    />
  )
}
