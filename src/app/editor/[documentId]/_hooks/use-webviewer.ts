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
import {
  downloadBlob,
  exportPdfBlob,
  handleSaveShortcutEvent,
} from "../_lib/editor-utils"

type UseWebViewerOptions = {
  licenseKey?: string
  documentId: string
  fileName: string
  downloadUrl: string
  onSaveShortcut?: () => void
}

// Kick off the WebViewer chunk download as soon as the editor route's JS
// evaluates, instead of waiting for hydration and the mount effect.
// Client components are still evaluated during SSR, hence the window guard.
const webviewerModulePromise =
  typeof window === "undefined" ? null : import("@pdftron/webviewer")

export function useWebViewer(
  viewerElementRef: React.RefObject<HTMLDivElement | null>,
  {
    licenseKey,
    documentId,
    fileName,
    downloadUrl,
    onSaveShortcut,
  }: UseWebViewerOptions
) {
  const instanceRef = useRef<WebViewerInstance | null>(null)
  const ignoreDirtyRef = useRef(false)
  // Kept in a ref so a new callback identity does not tear down and
  // reinitialize the whole viewer via the main effect.
  const onSaveShortcutRef = useRef(onSaveShortcut)

  useEffect(() => {
    onSaveShortcutRef.current = onSaveShortcut
  })

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

    void (webviewerModulePromise ?? import("@pdftron/webviewer"))
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

        // Keydown inside the WebViewer iframe never reaches the parent
        // window, so Ctrl+S needs its own listener there. iframeWindow is
        // not reliably set right after WebViewer() resolves, so the listener
        // attaches on documentLoaded, when the iframe certainly exists.
        // Capture phase wins over WebViewer's internal handlers; the iframe
        // (and listener) die with UI.dispose().
        const onIframeKeydown = (event: KeyboardEvent) =>
          handleSaveShortcutEvent(event, () => onSaveShortcutRef.current?.())
        let isShortcutAttached = false

        documentViewer.addEventListener("documentLoaded", () => {
          const iframeWindow = instance?.UI.iframeWindow

          if (!isShortcutAttached && iframeWindow) {
            iframeWindow.addEventListener("keydown", onIframeKeydown, true)
            isShortcutAttached = true
          }

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

  /**
   * Resolves as soon as the edited bytes are durably uploaded; the server
   * finalization (verify + promote + version record) continues in the
   * background so the UI never waits on it. Returns false when a save is
   * already in flight.
   */
  async function saveDocument() {
    const instance = instanceRef.current
    if (!instance) {
      throw new Error("The editor is still loading.")
    }

    const store = useEditorStore.getState()

    // A finalizing save still owns the next version number, so a new save
    // must wait for it to settle.
    if (store.isSaving || store.isFinalizing) {
      return false
    }

    const { setSaving, setFinalizing, setError, markSaved, markDirty } = store

    setSaving(true)

    // Edits made after this point are not part of the exported file; the
    // epoch lets markSaved keep the document dirty when that happens.
    const exportedEpoch = useEditorStore.getState().dirtyEpoch

    try {
      const blob = await exportPdfBlob(instance)
      const { uploadUrl, version } = await requestSaveUrl(documentId, blob.size)
      await putPdfToSignedUrl(uploadUrl, blob)

      // The PDF is durably in storage now; what remains is server-side
      // bookkeeping. Confirm the save immediately and finalize in the
      // background, rolling back loudly if that fails.
      markSaved(exportedEpoch)
      setFinalizing(true)

      void completeDocumentUpload({ documentId, size: blob.size, version })
        .catch((error: unknown) => {
          console.error("Failed to finalize PDF save:", error)

          // The user may have opened another document in the meantime.
          if (useEditorStore.getState().documentId !== documentId) {
            return
          }

          markDirty()
          setError(
            error instanceof DocumentApiError
              ? error.message
              : "The save could not be finalized. Save again."
          )
        })
        .finally(() => {
          if (useEditorStore.getState().documentId === documentId) {
            setFinalizing(false)
          }
        })

      return true
    } catch (error) {
      console.error("Failed to save PDF:", error)
      const message =
        error instanceof DocumentApiError
          ? error.message
          : "Save failed. Try again."
      setError(message)
      throw error
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
