"use client"

import { useEffect, useRef } from "react"
import type { WebViewerInstance } from "@pdftron/webviewer"

import {
  completeDocumentUpload,
  DocumentApiError,
  putPdfToSignedUrl,
  requestSaveUrl,
} from "@/lib/documents/browser"
import { WEBVIEWER_PATH } from "@/lib/webviewer/constants"
import { useEditorStore } from "@/stores/editor-store"
import { downloadBlob, exportPdfBlob } from "../_lib/editor-utils"

type UseWebViewerOptions = {
  licenseKey?: string
  documentId: string
  fileName: string
  downloadUrl: string
}

export function useWebViewer(
  viewerElementRef: React.RefObject<HTMLDivElement | null>,
  { licenseKey, documentId, fileName, downloadUrl }: UseWebViewerOptions
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

    ignoreDirtyRef.current = true

    const store = useEditorStore.getState()
    store.reset()
    store.setDocument(documentId, fileName)

    void import("@pdftron/webviewer")
      .then(async ({ default: WebViewer }) => {
        if (isDisposed || !viewerElementRef.current) {
          return
        }

        instance = await WebViewer(
          {
            path: WEBVIEWER_PATH,
            licenseKey: licenseKey || undefined,
            initialDoc: downloadUrl,
            filename: fileName,
            extension: "pdf",
            enableFilePicker: false,
            // Signed R2 URLs do not expose Content-Range, so skip range requests.
            streaming: false,
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
  }, [documentId, downloadUrl, fileName, licenseKey, viewerElementRef])

  async function saveDocument() {
    const instance = instanceRef.current
    if (!instance) {
      throw new Error("The editor is still loading.")
    }

    const { setSaving, setError, markSaved } = useEditorStore.getState()

    setSaving(true)
    ignoreDirtyRef.current = true

    try {
      const blob = await exportPdfBlob(instance)
      const { uploadUrl, version } = await requestSaveUrl(documentId, blob.size)
      await putPdfToSignedUrl(uploadUrl, blob)
      await completeDocumentUpload({
        documentId,
        size: blob.size,
        version,
      })
      markSaved()
    } catch (error) {
      console.error("Failed to save PDF:", error)
      const message =
        error instanceof DocumentApiError
          ? error.message
          : "Save failed. Try again."
      setError(message)
      throw error
    } finally {
      ignoreDirtyRef.current = false
    }
  }

  async function downloadPdf() {
    const instance = instanceRef.current
    if (!instance) {
      throw new Error("The editor is still loading.")
    }

    const { fileName: currentFileName } = useEditorStore.getState()

    try {
      const blob = await exportPdfBlob(instance)
      downloadBlob(blob, currentFileName)
    } catch (error) {
      console.error("Failed to download PDF:", error)
      throw error
    }
  }

  return {
    saveDocument,
    downloadPdf,
  }
}
