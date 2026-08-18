"use client"

import { useRef } from "react"
import { FolderOpenIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { PdfFileError, pdfFileErrorMessage } from "@/app/editor/_lib/pdf-file"

type OpenPdfButtonProps = {
  disabled?: boolean
  onOpen: (file: File) => Promise<void>
}

export function OpenPdfButton({ disabled, onOpen }: OpenPdfButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    try {
      await onOpen(file)
      toast.success(`Opened ${file.name}`)
    } catch (error) {
      console.error("Failed to open PDF:", error)
      if (error instanceof PdfFileError) {
        toast.error(pdfFileErrorMessage(error.code))
        return
      }
      toast.error("The PDF could not be opened.")
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <FolderOpenIcon data-icon="inline-start" />
        Open PDF
      </Button>
    </>
  )
}
