"use client"

import { useEffect, useRef } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useEditorStore } from "@/stores/editor-store"
import { EditorToolbar } from "@/app/editor/_components/editor-toolbar"
import { useWebViewer } from "@/app/editor/_hooks/use-webviewer"

type PdfEditorProps = {
  licenseKey?: string
}

export function PdfEditor({ licenseKey }: PdfEditorProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const { openFile, exportAndReload, downloadPdf } = useWebViewer(viewerRef, {
    licenseKey,
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
    <div className="flex h-dvh min-h-0 flex-col bg-background">
      <EditorToolbar
        onOpen={openFile}
        onExportAndReload={exportAndReload}
        onDownload={downloadPdf}
      />
      <div className="relative min-h-0 flex-1">
        {!isReady ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
            <div className="flex w-full max-w-sm flex-col gap-3 px-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-[70vh] w-full" />
              <p className="text-sm text-muted-foreground">Loading PDF editor…</p>
            </div>
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
        <div ref={viewerRef} className="h-full w-full" />
      </div>
    </div>
  )
}
