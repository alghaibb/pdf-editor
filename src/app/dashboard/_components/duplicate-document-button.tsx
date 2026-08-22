"use client"

import { useState } from "react"

import { LoadingButton } from "@/components/ui/loading-button"

type DuplicateDocumentButtonProps = {
  disabled?: boolean
  onConfirm: () => Promise<void>
}

export function DuplicateDocumentButton({
  disabled,
  onConfirm,
}: DuplicateDocumentButtonProps) {
  const [isDuplicating, setIsDuplicating] = useState(false)

  async function handleClick() {
    setIsDuplicating(true)

    try {
      await onConfirm()
    } finally {
      setIsDuplicating(false)
    }
  }

  return (
    <LoadingButton
      type="button"
      variant="outline"
      size="sm"
      loading={isDuplicating}
      loadingText="Copying..."
      disabled={disabled || isDuplicating}
      onClick={() => void handleClick()}
    >
      Duplicate
    </LoadingButton>
  )
}
