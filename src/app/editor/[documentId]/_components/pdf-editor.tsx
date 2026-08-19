"use client"

import { useEffect, useRef } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useEditorStore } from "@/stores/editor-store"
import { EditorToolbar } from "./editor-toolbar"
import { useWebViewer } from "../_hooks/use-webviewer"

type PdfEditorProps = {
  documentId: string
  fileName: string
  downloadUrl: string
  licenseKey?: string
}

export function PdfEditor({
  documentId,
  fileName,
  downloadUrl,
  licenseKey,
}: PdfEditorProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const { saveDocument, downloadPdf } = useWebViewer(viewerRef, {
    licenseKey,
    documentId,
    fileName,
    downloadUrl,
  })
  const isReady = useEditorStore((state) => state.isReady)
  const errorMessage = useEditorStore((state) => state.errorMessage)

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!useEditorStore.getState().isDirty) {
        return
      }

      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [])

  return (
    <div className="flex h-dvh min-h-0 min-w-0 flex-col overflow-hidden bg-background">
      <EditorToolbar onSave={saveDocument} onDownload={downloadPdf} />
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        {!isReady ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
            <Skeleton
              className="h-[min(90%,52rem)] w-full max-w-3xl"
              aria-label="Loading PDF"
            />
          </div>
        ) : null}
        {errorMessage ? (
          <div className="absolute top-4 right-4 left-4 z-20 md:left-auto md:w-96">
            <Alert variant="destructive">
              <AlertTitle>Editor message</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </div>
        ) : null}
        <div ref={viewerRef} className="h-full min-h-0 w-full min-w-0" />
      </div>
    </div>
  )
}
