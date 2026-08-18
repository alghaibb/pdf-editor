"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { UploadIcon } from "lucide-react"
import { toast } from "sonner"

import { LoadingButton } from "@/components/ui/loading-button"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import {
  completeDocumentUpload,
  DocumentApiError,
  putPdfToSignedUrl,
  requestUploadUrl,
} from "@/lib/documents/browser"
import { PDF_MIME_TYPE } from "@/lib/pdf/constants"
import { PdfFileError, assertPdfFile, pdfFileErrorMessage } from "@/lib/pdf/file"

type UploadDocumentButtonProps = {
  disabled?: boolean
}

export function UploadDocumentButton({
  disabled = false,
}: UploadDocumentButtonProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    setIsUploading(true)
    setProgress(0)

    try {
      await assertPdfFile(file)

      const { documentId, version, uploadUrl } = await requestUploadUrl({
        name: file.name,
        size: file.size,
        mimeType: file.type || PDF_MIME_TYPE,
      })

      await putPdfToSignedUrl(uploadUrl, file, setProgress)
      await completeDocumentUpload({
        documentId,
        size: file.size,
        version,
      })

      toast.success("PDF uploaded.")
      router.push(`/editor/${documentId}`)
      router.refresh()
    } catch (error) {
      console.error("Failed to upload PDF:", error)

      if (error instanceof PdfFileError) {
        toast.error(pdfFileErrorMessage(error.code))
        return
      }

      if (error instanceof DocumentApiError) {
        toast.error(error.message)
        return
      }

      toast.error("The PDF could not be uploaded.")
    } finally {
      setIsUploading(false)
      setProgress(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        disabled={isUploading || disabled}
        onChange={handleChange}
      />
      <LoadingButton
        type="button"
        variant="glow"
        className="w-fit"
        loading={isUploading}
        loadingText="Uploading..."
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <UploadIcon data-icon="inline-start" />
        Upload PDF
      </LoadingButton>
      {progress !== null ? (
        <Progress value={progress} className="max-w-sm">
          <ProgressLabel>Uploading</ProgressLabel>
          <ProgressValue />
        </Progress>
      ) : null}
    </div>
  )
}
