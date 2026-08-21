"use client"

import { useEffect, useRef } from "react"
import { preconnect } from "react-dom"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useEditorStore } from "@/stores/editor-store"
import { EditorToolbar } from "./editor-toolbar"
import { useEditorKeyboardShortcuts } from "../_hooks/use-editor-keyboard-shortcuts"
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
  // Warm DNS + TLS to the R2 origin now; WebViewer fetches the PDF from it
  // only after its own scripts boot, so the handshake is off the critical path.
  preconnect(new URL(downloadUrl).origin, { crossOrigin: "anonymous" })

  const viewerRef = useRef<HTMLDivElement>(null)
  const { saveDocument, downloadPdf } = useWebViewer(viewerRef, {
    licenseKey,
    documentId,
    fileName,
    downloadUrl,
    onSaveShortcut: () => void handleSave(),
  })
  const isReady = useEditorStore((state) => state.isReady)
  const errorMessage = useEditorStore((state) => state.errorMessage)

  async function handleSave() {
    try {
      const didSave = await saveDocument()

      if (didSave) {
        toast.success("PDF saved.")
      }
    } catch (error) {
      console.error("Failed to save PDF:", error)
      toast.error("Could not save the PDF.")
    }
  }

  async function handleDownload() {
    const { setDownloading } = useEditorStore.getState()

    setDownloading(true)

    try {
      await downloadPdf()
      toast.success("PDF downloaded.")
    } catch (error) {
      console.error("Failed to download PDF:", error)
      toast.error("Could not download the PDF.")
    } finally {
      setDownloading(false)
    }
  }

  useEditorKeyboardShortcuts({ onSave: () => void handleSave() })

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      const { isDirty, isFinalizing } = useEditorStore.getState()

      if (!isDirty && !isFinalizing) {
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
      <EditorToolbar
        documentId={documentId}
        onSave={handleSave}
        onDownload={handleDownload}
      />
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
