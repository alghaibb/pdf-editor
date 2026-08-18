"use client"

import { useEffect, useRef } from "react"
import type { WebViewerInstance } from "@pdftron/webviewer"

import { useEditorStore } from "@/stores/editor-store"
import {
  SAMPLE_PDF_NAME,
  SAMPLE_PDF_PATH,
  WEBVIEWER_PATH,
} from "@/lib/webviewer/constants"
import { downloadBlob, exportPdfBlob } from "@/app/editor/_lib/editor-utils"
import { assertPdfFile } from "@/app/editor/_lib/pdf-file"

type UseWebViewerOptions = {
  licenseKey?: string
}

export function useWebViewer(
  viewerElementRef: React.RefObject<HTMLDivElement | null>,
  { licenseKey }: UseWebViewerOptions
) {
  const instanceRef = useRef<WebViewerInstance | null>(null)
  const ignoreDirtyRef = useRef(false)

  useEffect(() => {
    const viewerElement = viewerElementRef.current
    if (!viewerElement) {
      return
    }

    let isDisposed = false
    let instance: WebViewerInstance | undefined

    const store = useEditorStore.getState()
    store.reset()
    store.setFileName(SAMPLE_PDF_NAME)

    void import("@pdftron/webviewer")
      .then(async ({ default: WebViewer }) => {
        if (isDisposed || !viewerElementRef.current) {
          return
        }

        instance = await WebViewer(
          {
            path: WEBVIEWER_PATH,
            licenseKey: licenseKey || undefined,
            initialDoc: SAMPLE_PDF_PATH,
            filename: SAMPLE_PDF_NAME,
            enableFilePicker: false,
          },
          viewerElementRef.current
        )

        if (isDisposed) {
          await instance.UI.dispose()
          return
        }

        instanceRef.current = instance
        instance.UI.enableFeatures([instance.UI.Feature.ContentEdit])
        instance.UI.setToolbarGroup("toolbarGroup-Edit")

        const { documentViewer, ContentEdit } = instance.Core
        const contentEditManager = documentViewer.getContentEditManager()

        const markDirty = () => {
          if (ignoreDirtyRef.current) {
            return
          }
          useEditorStore.getState().markDirty()
        }

        contentEditManager.addEventListener("contentBoxEditEnded", markDirty)
        contentEditManager.addEventListener("contentBoxAdded", markDirty)
        contentEditManager.addEventListener("contentBoxDeleted", markDirty)

        documentViewer.addEventListener("documentLoaded", () => {
          void (async () => {
            try {
              await ContentEdit.preloadWorker(contentEditManager)
              await contentEditManager.startContentEditMode()
              useEditorStore.getState().markSaved()
            } catch (error) {
              console.error("Failed to start PDF content editing:", error)
              useEditorStore
                .getState()
                .setError(
                  "This PDF could not enter content editing. It may not contain a usable text layer."
                )
            } finally {
              ignoreDirtyRef.current = false
              useEditorStore.getState().setReady(true)
            }
          })()
        })
      })
      .catch((error: unknown) => {
        console.error("Failed to initialize WebViewer:", error)
        useEditorStore
          .getState()
          .setError("The PDF editor failed to load. Refresh and try again.")
      })

    return () => {
      isDisposed = true
      instanceRef.current = null
      useEditorStore.getState().reset()
      void instance?.UI.dispose().catch((error: unknown) => {
        console.error("Failed to dispose WebViewer:", error)
      })
    }
  }, [licenseKey, viewerElementRef])

  async function openFile(file: File) {
    const instance = instanceRef.current
    if (!instance) {
      throw new Error("The editor is still loading.")
    }

    await assertPdfFile(file)
    ignoreDirtyRef.current = true
    useEditorStore.getState().setFileName(file.name)
    useEditorStore.getState().setReady(false)
    await instance.UI.loadDocument(file, {
      filename: file.name,
      extension: "pdf",
    })
  }

  async function exportAndReload() {
    const instance = instanceRef.current
    if (!instance) {
      throw new Error("The editor is still loading.")
    }

    const { fileName, setExporting, setError } = useEditorStore.getState()

    setExporting(true)
    ignoreDirtyRef.current = true

    try {
      const blob = await exportPdfBlob(instance)
      useEditorStore.getState().setReady(false)
      await instance.UI.loadDocument(blob, {
        filename: fileName,
        extension: "pdf",
      })
    } catch (error) {
      console.error("Failed to export and reload PDF:", error)
      ignoreDirtyRef.current = false
      setError("Export failed. Try again.")
      throw error
    }
  }

  async function downloadPdf() {
    const instance = instanceRef.current
    if (!instance) {
      throw new Error("The editor is still loading.")
    }

    const { fileName, setExporting, markSaved, setError } =
      useEditorStore.getState()

    setExporting(true)

    try {
      const blob = await exportPdfBlob(instance)
      downloadBlob(blob, fileName)
      markSaved()
    } catch (error) {
      console.error("Failed to download PDF:", error)
      setError("Download failed. Try again.")
      throw error
    }
  }

  return {
    openFile,
    exportAndReload,
    downloadPdf,
  }
}
