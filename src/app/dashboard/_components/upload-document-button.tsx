"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import { FileTextIcon, UploadIcon } from "lucide-react"
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

const SAMPLE_PDF_PATH = "/samples/sample-invoice.pdf"
const SAMPLE_PDF_NAME = "Sample invoice.pdf"

export function UploadDocumentButton({
  disabled = false,
  isEmpty = false,
}: UploadDocumentButtonProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [isPreparingSample, setIsPreparingSample] = useState(false)
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

  // The sample ships as a same-origin static file, so it reuses the exact
  // upload pipeline a real PDF goes through — no separate server path.
  const openSample = useCallback(async () => {
    setIsPreparingSample(true)

    try {
      const response = await fetch(SAMPLE_PDF_PATH)

      if (!response.ok) {
        throw new Error(`Sample PDF request failed: ${response.status}`)
      }

      const blob = await response.blob()
      const file = new File([blob], SAMPLE_PDF_NAME, { type: PDF_MIME_TYPE })

      await uploadFile(file)
    } catch (error) {
      console.error("Failed to load the sample PDF:", error)
      toast.error("The sample PDF could not be loaded.")
    } finally {
      setIsPreparingSample(false)
    }
  }, [uploadFile])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: {
      [PDF_MIME_TYPE]: [".pdf"],
    },
    maxSize: MAX_PDF_SIZE_BYTES,
    multiple: false,
    disabled: isUploading || isPreparingSample || disabled,
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
            "border border-border bg-background px-6 py-8 transition-colors sm:px-8",
            isEmpty ? "sm:py-12" : "sm:py-6",
            isDragActive && "border-foreground bg-muted/40",
            disabled && "opacity-60"
          ),
        })}
      >
        <input {...getInputProps()} />
        <div
          className={cn(
            "flex flex-col",
            isEmpty
              ? "gap-0"
              : "gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8"
          )}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.28em] text-muted-foreground uppercase">
              {isEmpty ? "Folio / empty" : "Add a file"}
            </p>
            {isEmpty ? (
              <h2 className="font-heading mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                Nothing here yet.
                <span className="mt-1 block italic">Drop a PDF to start.</span>
              </h2>
            ) : (
              <p className="font-heading mt-3 text-2xl font-semibold tracking-tight">
                {isDragActive ? "Drop the PDF." : "Drop a PDF, or choose one."}
              </p>
            )}
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              {disabled
                ? "File storage is not configured yet."
                : isEmpty
                  ? "The file opens in the editor with its real text still inside."
                  : "It opens with the original wording still in the file."}
            </p>
          </div>
          <div
            className={cn(
              "flex shrink-0 flex-wrap items-center gap-3",
              isEmpty && "mt-8"
            )}
          >
            <LoadingButton
              type="button"
              variant="glow"
              loading={isUploading && !isPreparingSample}
              loadingText="Uploading..."
              disabled={disabled || isPreparingSample}
              onClick={open}
            >
              <UploadIcon data-icon="inline-start" />
              {isEmpty ? "Upload PDF" : "Choose PDF"}
            </LoadingButton>
            {isEmpty ? (
              <LoadingButton
                type="button"
                variant="outline"
                loading={isPreparingSample}
                loadingText="Opening sample..."
                disabled={disabled || isUploading}
                onClick={() => void openSample()}
              >
                <FileTextIcon data-icon="inline-start" />
                Try the sample invoice
              </LoadingButton>
            ) : null}
          </div>
        </div>
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
