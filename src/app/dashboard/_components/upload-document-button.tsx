"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
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
import { MAX_PDF_SIZE_BYTES, PDF_MIME_TYPE } from "@/lib/pdf/constants"
import {
  PdfFileError,
  assertPdfFile,
  pdfFileErrorMessage,
} from "@/lib/pdf/file"
import { cn } from "@/lib/utils"
import { DashboardCropFrame } from "@/app/dashboard/_components/dashboard-crop-frame"

type UploadDocumentButtonProps = {
  disabled?: boolean
  isEmpty?: boolean
}

export function UploadDocumentButton({
  disabled = false,
  isEmpty = false,
}: UploadDocumentButtonProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)

  const uploadFile = useCallback(
    async (file: File) => {
      setIsUploading(true)
      setProgress(0)

      try {
        await assertPdfFile(file)

        const { documentId, version, uploadUrl } = await requestUploadUrl({
          name: file.name,
          size: file.size,
          mimeType: file.type || PDF_MIME_TYPE,
        })

        void router.prefetch(`/editor/${documentId}`)

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
    },
    [router]
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: {
      [PDF_MIME_TYPE]: [".pdf"],
    },
    maxSize: MAX_PDF_SIZE_BYTES,
    multiple: false,
    disabled: isUploading || disabled,
    noClick: true,
    noKeyboard: true,
    onDrop: (files) => {
      const file = files[0]

      if (!file) {
        return
      }

      void uploadFile(file)
    },
    onDropRejected: (rejections) => {
      const code = rejections[0]?.errors[0]?.code

      if (code === "file-too-large") {
        toast.error("Choose a PDF that is 50 MB or smaller.")
        return
      }

      toast.error("Choose a PDF file.")
    },
  })

  return (
    <DashboardCropFrame>
      <div
        {...getRootProps({
          className: cn(
            "border border-border bg-background px-6 py-10 transition-colors sm:px-10",
            isEmpty ? "sm:py-14" : "sm:py-8",
            isDragActive && "border-foreground bg-muted/40",
            disabled && "opacity-60"
          ),
        })}
      >
        <input {...getInputProps()} />
        <p className="text-[11px] font-semibold tracking-[0.28em] text-muted-foreground uppercase">
          {isEmpty ? "Folio / empty" : "Add a file"}
        </p>
        {isEmpty ? (
          <h2 className="font-heading mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            Nothing here yet.
            <span className="mt-1 block italic">Drop a PDF to start.</span>
          </h2>
        ) : (
          <p className="font-heading mt-4 text-2xl font-semibold tracking-tight">
            {isDragActive ? "Drop the PDF." : "Drop a PDF, or choose one."}
          </p>
        )}
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          {disabled
            ? "File storage is not configured yet."
            : "The file opens in the editor with its real text still inside."}
        </p>
        <LoadingButton
          type="button"
          variant="glow"
          className="mt-8 w-fit"
          loading={isUploading}
          loadingText="Uploading..."
          disabled={disabled}
          onClick={open}
        >
          <UploadIcon data-icon="inline-start" />
          {isEmpty ? "Upload PDF" : "Choose PDF"}
        </LoadingButton>
        {progress !== null ? (
          <Progress value={progress} className="mt-6 max-w-sm">
            <ProgressLabel>Uploading</ProgressLabel>
            <ProgressValue />
          </Progress>
        ) : null}
      </div>
    </DashboardCropFrame>
  )
}
