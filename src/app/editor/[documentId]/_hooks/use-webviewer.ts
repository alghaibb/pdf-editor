"use client"

import { useCallback, useEffect, useRef } from "react"
import type { Core, WebViewerInstance } from "@pdftron/webviewer"

import {
  completeDocumentUpload,
  DocumentApiError,
  putPdfToSignedUrl,
  requestSaveUrl,
} from "@/lib/documents/browser"
import { WEBVIEWER_PATH } from "@/lib/webviewer/constants"
import { useEditorStore } from "@/stores/editor-store"
import { PdfFileError, pdfFileErrorMessage } from "@/lib/pdf/file"
import {
  downloadBlob,
  exportPdfBlob,
  handleSaveShortcutEvent,
} from "../_lib/editor-utils"
import {
  getCurrentPageInfo,
  LastPageError,
  removePage,
} from "../_lib/delete-pages"
import { getApryseHistory } from "../_lib/history"
import { insertPagesFromPdfFile } from "../_lib/insert-pages"
import {
  goToPage,
  loadPageThumbnail,
  rotatePage,
} from "../_lib/page-thumbs"
import { OcrError, recognizeScannedPages } from "../_lib/ocr"
import { clearRecoveryStash, stashRecoveryPdf } from "../_lib/recovery"

type UseWebViewerOptions = {
  licenseKey?: string
  documentId: string
  fileName: string
  downloadUrl: string
  currentVersion: number
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
    currentVersion,
    onSaveShortcut,
  }: UseWebViewerOptions
) {
  const instanceRef = useRef<WebViewerInstance | null>(null)
  const ignoreDirtyRef = useRef(false)
  // Set while reloading bytes that only exist locally (crash recovery) so
  // the load pipeline ends in a dirty state instead of "Saved".
  const endsDirtyAfterLoadRef = useRef(false)
  // Kept in refs so new identities/values do not tear down and
  // reinitialize the whole viewer via the main effect. In particular, a
  // version restore refreshes the page with a newly signed download URL;
  // the document swaps into the running viewer instead of rebooting it.
  const onSaveShortcutRef = useRef(onSaveShortcut)
  const fileNameRef = useRef(fileName)
  const latestDownloadUrlRef = useRef(downloadUrl)
  const latestVersionRef = useRef(currentVersion)
  // The URL the viewer actually has loaded; null until the first boot
  // finishes and after disposal.
  const loadedDownloadUrlRef = useRef<string | null>(null)
  const loadedVersionRef = useRef<number | null>(null)

  useEffect(() => {
    onSaveShortcutRef.current = onSaveShortcut
    fileNameRef.current = fileName
    latestDownloadUrlRef.current = downloadUrl
    latestVersionRef.current = currentVersion
  })

  /**
   * Loads a different document source into the running viewer without
   * rebooting WebViewer. Content-edit mode must end before the swap or
   * the reload can wedge and leave the skeleton up forever; the
   * documentLoaded pipeline starts it again for the new bytes.
   */
  const reloadDocumentInPlace = useCallback(
    (source: string | Blob, { endsDirty }: { endsDirty: boolean }) => {
      const instance = instanceRef.current
      if (!instance) {
        throw new Error("The editor is still loading.")
      }

      const contentEditManager =
        instance.Core.documentViewer.getContentEditManager()

      if (contentEditManager.isInContentEditMode()) {
        contentEditManager.endContentEditMode()
      }

      endsDirtyAfterLoadRef.current = endsDirty
      ignoreDirtyRef.current = true
      useEditorStore.getState().setReady(false)
      void instance.UI.loadDocument(source, {
        filename: fileNameRef.current,
        extension: "pdf",
      })
    },
    []
  )

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
    store.setDocument(documentId, fileNameRef.current)

    void (webviewerModulePromise ?? import("@pdftron/webviewer"))
      .then(async ({ default: WebViewer }) => {
        if (isDisposed || !viewerElementRef.current) {
          return
        }

        const bootDownloadUrl = latestDownloadUrlRef.current

        instance = await WebViewer(
          {
            path: WEBVIEWER_PATH,
            licenseKey: licenseKey || undefined,
            initialDoc: bootDownloadUrl,
            filename: fileNameRef.current,
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
        loadedDownloadUrlRef.current = bootDownloadUrl
        loadedVersionRef.current = latestVersionRef.current
        instance.UI.enableFeatures([instance.UI.Feature.ContentEdit])
        instance.UI.setToolbarGroup("toolbarGroup-Edit")

        if (process.env.NODE_ENV !== "production") {
          // Test seam: E2E specs drive real editor behaviour (annotations,
          // dirty state) through the Core API, which Playwright cannot
          // reach inside the rendered canvas. Dev-only, stripped from
          // production bundles.
          ;(
            window as unknown as { __pdfEditor?: unknown }
          ).__pdfEditor = { instance, store: useEditorStore }
        }

        const { documentViewer, ContentEdit } = instance.Core
        const contentEditManager = documentViewer.getContentEditManager()

        const refreshHistory = () => {
          const viewer = instanceRef.current

          if (!viewer) {
            return
          }

          const history = getApryseHistory(viewer)
          useEditorStore
            .getState()
            .setHistoryAvailability(history.canUndo(), history.canRedo())
        }

        const markDirty = () => {
          if (ignoreDirtyRef.current) {
            return
          }
          useEditorStore.getState().markDirty()
          refreshHistory()
        }

        contentEditManager.addEventListener("contentBoxEditEnded", markDirty)
        contentEditManager.addEventListener("contentBoxAdded", markDirty)
        contentEditManager.addEventListener("contentBoxDeleted", markDirty)

        const { annotationManager } = instance.Core

        // Content editing mirrors editable text blocks as placeholder
        // annotations; adding/removing those is mode setup, not a user
        // edit. Modify actions are kept because dragging a content box
        // only surfaces here. Everything else (highlights, ink,
        // signatures, form widgets) is a real edit that must enable Save.
        annotationManager.addEventListener(
          "annotationChanged",
          (
            annotations: Core.Annotations.Annotation[],
            action: string,
            info: { imported: boolean }
          ) => {
            if (info.imported) {
              return
            }

            const isRealEdit = annotations.some(
              (annotation) =>
                action === "modify" || !annotation.isContentEditPlaceholder()
            )

            if (isRealEdit) {
              markDirty()
            }
          }
        )

        // Filling an existing form field never fires annotationChanged.
        annotationManager.addEventListener("fieldChanged", markDirty)

        // Page structure changes (rotate, reorder, insert, delete) from
        // the thumbnail panel only surface through pagesUpdated.
        documentViewer.addEventListener("pagesUpdated", () => {
          syncPageInfo(documentViewer)
          useEditorStore.getState().bumpPageEpoch()
          markDirty()
        })
        documentViewer.addEventListener("pageNumberUpdated", (pageNumber: number) => {
          const loaded = documentViewer.getDocument()
          useEditorStore
            .getState()
            .setPageInfo(pageNumber, loaded?.getPageCount() ?? 1)
        })

        // Keydown inside the WebViewer iframe never reaches the parent
        // window, so Ctrl+S needs its own listener there. iframeWindow is
        // not reliably set right after WebViewer() resolves, so the listener
        // attaches on documentLoaded, when the iframe certainly exists.
        // Capture phase wins over WebViewer's internal handlers; the iframe
        // (and listener) die with UI.dispose().
        const onIframeKeydown = (event: KeyboardEvent) => {
          handleSaveShortcutEvent(event, () => onSaveShortcutRef.current?.())
          // Content-edit undo stays with Apryse inside the iframe. Page
          // undo is triggered from the parent toolbar / window shortcuts.
        }
        let isShortcutAttached = false

        documentViewer.addEventListener("documentLoaded", () => {
          const iframeWindow = instance?.UI.iframeWindow

          if (!isShortcutAttached && iframeWindow) {
            iframeWindow.addEventListener("keydown", onIframeKeydown, true)
            isShortcutAttached = true
          }

          // Re-signed URLs for the same saved version are the same file.
          // Reloading on every RSC refresh kept the skeleton up forever.
          if (
            loadedVersionRef.current !== null &&
            loadedVersionRef.current !== latestVersionRef.current
          ) {
            loadedVersionRef.current = latestVersionRef.current
            loadedDownloadUrlRef.current = latestDownloadUrlRef.current
            reloadDocumentInPlace(latestDownloadUrlRef.current, {
              endsDirty: false,
            })
            return
          }

          // Show the PDF as soon as pages exist. Content-edit workers can
          // stall; they must not own the loading skeleton.
          useEditorStore.getState().setReady(true)

          void (async () => {
            let timeoutId = 0

            try {
              await Promise.race([
                (async () => {
                  await ContentEdit.preloadWorker(contentEditManager)
                  await contentEditManager.startContentEditMode()
                })(),
                new Promise<void>((_resolve, reject) => {
                  timeoutId = window.setTimeout(() => {
                    reject(new Error("Content editing took too long to start."))
                  }, 20_000)
                }),
              ])

              if (endsDirtyAfterLoadRef.current) {
                // Recovered bytes only exist locally until the next save.
                endsDirtyAfterLoadRef.current = false
                useEditorStore.getState().markDirty()
              } else {
                useEditorStore.getState().markSaved()
              }

              void warnWhenTextLayerMissing(documentViewer)
            } catch (error) {
              console.error("Failed to start PDF content editing:", error)
              useEditorStore
                .getState()
                .setError(
                  "This PDF could not enter content editing. It may not contain a usable text layer."
                )
            } finally {
              window.clearTimeout(timeoutId)
              ignoreDirtyRef.current = false

              try {
                syncPageInfo(documentViewer)
              } catch (error) {
                console.error("Failed to sync page info:", error)
              }

              const viewer = instanceRef.current

              if (viewer) {
                try {
                  refreshHistoryAvailability(viewer)
                } catch (error) {
                  console.error("Failed to refresh undo history:", error)
                }
              }
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
      loadedDownloadUrlRef.current = null
      loadedVersionRef.current = null
      useEditorStore.getState().reset()
      void instance?.UI.dispose().catch((error: unknown) => {
        console.error("Failed to dispose WebViewer:", error)
      })
    }
  }, [documentId, licenseKey, reloadDocumentInPlace, viewerElementRef])

  // Restore copies a previous file over current.pdf and bumps
  // currentVersion. A new signed URL alone is not a new file — Cache
  // Components re-renders this page often and would otherwise reload
  // the viewer in a loop.
  useEffect(() => {
    if (
      loadedDownloadUrlRef.current === null ||
      loadedVersionRef.current === currentVersion ||
      !instanceRef.current
    ) {
      return
    }

    loadedVersionRef.current = currentVersion
    loadedDownloadUrlRef.current = downloadUrl

    try {
      reloadDocumentInPlace(downloadUrl, { endsDirty: false })
    } catch (error) {
      console.error("Failed to load the restored document:", error)
    }
  }, [currentVersion, downloadUrl, reloadDocumentInPlace])

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

    let blob: Blob | undefined
    let targetVersion: number | undefined

    try {
      blob = await exportPdfBlob(instance)
      const { uploadUrl, version } = await requestSaveUrl(documentId, blob.size)
      targetVersion = version
      await putPdfToSignedUrl(uploadUrl, blob)

      // The PDF is durably in storage now; what remains is server-side
      // bookkeeping. Confirm the save immediately and finalize in the
      // background, rolling back loudly if that fails.
      markSaved(exportedEpoch)
      setFinalizing(true)

      // The uploaded bytes supersede any crash stash from earlier failures.
      void clearRecoveryStash(documentId).catch((error: unknown) => {
        console.error("Failed to clear recovered edits:", error)
      })

      const uploadedBlob = blob

      void completeDocumentUpload({ documentId, size: blob.size, version })
        .catch((error: unknown) => {
          console.error("Failed to finalize PDF save:", error)
          stashForRecovery(uploadedBlob, version)

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

      // Keep the exported bytes locally so the next visit to this
      // document can offer to restore them (crash/offline recovery).
      if (blob) {
        stashForRecovery(blob, targetVersion)
      }

      const message =
        error instanceof DocumentApiError
          ? error.message
          : "Save failed. Try again."
      setError(message)
      throw error
    }
  }

  function stashForRecovery(blob: Blob, targetVersion: number | undefined) {
    void stashRecoveryPdf({
      documentId,
      fileName: fileNameRef.current,
      blob,
      targetVersion,
    }).catch((error: unknown) => {
      console.error("Failed to stash edits for recovery:", error)
    })
  }

  /**
   * Reloads locally recovered bytes through the normal document pipeline.
   * The load ends dirty instead of "Saved", since the recovered edits only
   * exist in this browser until saved.
   */
  function loadRecoveredPdf(blob: Blob) {
    reloadDocumentInPlace(blob, { endsDirty: true })
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

  async function recognizeText() {
    const instance = instanceRef.current

    if (!instance) {
      throw new Error("The editor is still loading.")
    }

    useEditorStore.getState().setReady(false)
    useEditorStore
      .getState()
      .setNotice("Reading text from the page images...")

    try {
      const blob = await recognizeScannedPages(instance, ({ page, pageCount }) => {
        useEditorStore
          .getState()
          .setNotice(`Reading text from page ${page} of ${pageCount}...`)
      })

      reloadDocumentInPlace(blob, { endsDirty: true })
      useEditorStore
        .getState()
        .setNotice("Text was added from the page images. Save to keep it.")
    } catch (error) {
      console.error("Failed to recognize PDF text:", error)
      useEditorStore.getState().setReady(true)

      if (error instanceof OcrError) {
        useEditorStore.getState().setNotice(error.message)
        throw error
      }

      useEditorStore
        .getState()
        .setError("Text could not be read from the page images. Try again.")
      throw error
    }
  }

  async function runPageStructureChange(
    instance: WebViewerInstance,
    action: () => Promise<void>
  ) {
    const contentEditManager =
      instance.Core.documentViewer.getContentEditManager()

    if (contentEditManager.isInContentEditMode()) {
      contentEditManager.endContentEditMode()
    }

    try {
      await action()
      await instance.Core.ContentEdit.preloadWorker(contentEditManager)
      await contentEditManager.startContentEditMode()
      useEditorStore.getState().markDirty()
    } catch (error) {
      try {
        await instance.Core.ContentEdit.preloadWorker(contentEditManager)
        await contentEditManager.startContentEditMode()
      } catch (restartError) {
        console.error("Failed to restart content editing:", restartError)
      }

      throw error
    }
  }

  function refreshHistoryAvailability(instance: WebViewerInstance) {
    const history = getApryseHistory(instance)
    useEditorStore
      .getState()
      .setHistoryAvailability(history.canUndo(), history.canRedo())
  }

  async function undoEdit() {
    const instance = instanceRef.current

    if (!instance) {
      throw new Error("The editor is still loading.")
    }

    const history = getApryseHistory(instance)
    history.undo()
    refreshHistoryAvailability(instance)
  }

  async function redoEdit() {
    const instance = instanceRef.current

    if (!instance) {
      throw new Error("The editor is still loading.")
    }

    const history = getApryseHistory(instance)
    history.redo()
    refreshHistoryAvailability(instance)
  }

  async function insertPagesFromPdf(file: File) {
    const instance = instanceRef.current

    if (!instance) {
      throw new Error("The editor is still loading.")
    }

    try {
      await runPageStructureChange(instance, () =>
        insertPagesFromPdfFile(instance, file)
      )
      refreshHistoryAvailability(instance)
    } catch (error) {
      console.error("Failed to insert PDF pages:", error)

      if (error instanceof PdfFileError) {
        throw new Error(pdfFileErrorMessage(error.code))
      }

      throw error instanceof Error
        ? error
        : new Error("The pages could not be inserted.")
    }
  }

  function readCurrentPage() {
    const instance = instanceRef.current

    if (!instance) {
      return null
    }

    return getCurrentPageInfo(instance)
  }

  async function deletePageAt(page: number) {
    const instance = instanceRef.current

    if (!instance) {
      throw new Error("The editor is still loading.")
    }

    try {
      await runPageStructureChange(instance, async () => {
        await removePage(instance, page)
      })
      refreshHistoryAvailability(instance)
    } catch (error) {
      console.error("Failed to delete the page:", error)

      if (error instanceof LastPageError) {
        throw error
      }

      throw error instanceof Error
        ? error
        : new Error("The page could not be deleted.")
    }
  }

  async function deleteCurrentPage() {
    const info = readCurrentPage()

    if (!info) {
      throw new Error("The editor is still loading.")
    }

    await deletePageAt(info.page)
  }

  function jumpToPage(page: number) {
    const instance = instanceRef.current

    if (!instance) {
      throw new Error("The editor is still loading.")
    }

    goToPage(instance, page)
  }

  async function rotatePageAt(page: number) {
    const instance = instanceRef.current

    if (!instance) {
      throw new Error("The editor is still loading.")
    }

    try {
      await runPageStructureChange(instance, () => rotatePage(instance, page))
      refreshHistoryAvailability(instance)
    } catch (error) {
      console.error("Failed to rotate the page:", error)
      throw error instanceof Error
        ? error
        : new Error("The page could not be rotated.")
    }
  }

  const getPageThumbnail = useCallback(async (page: number) => {
    const instance = instanceRef.current

    if (!instance) {
      throw new Error("The editor is still loading.")
    }

    return loadPageThumbnail(instance, page)
  }, [])

  return {
    saveDocument,
    downloadPdf,
    loadRecoveredPdf,
    recognizeText,
    insertPagesFromPdf,
    deleteCurrentPage,
    deletePageAt,
    readCurrentPage,
    jumpToPage,
    rotatePageAt,
    getPageThumbnail,
    undoEdit,
    redoEdit,
  }
}

function syncPageInfo(documentViewer: Core.DocumentViewer) {
  const loaded = documentViewer.getDocument()
  useEditorStore
    .getState()
    .setPageInfo(
      documentViewer.getCurrentPage(),
      loaded?.getPageCount() ?? 1
    )
}

/**
 * Scanned PDFs have no text layer, so content editing looks enabled but
 * has nothing to edit. Say so honestly instead of letting the user hunt
 * for editable text; real OCR requires the licensed Apryse module.
 */
async function warnWhenTextLayerMissing(
  documentViewer: Core.DocumentViewer
) {
  try {
    const pdfDocument = documentViewer.getDocument()

    if (!pdfDocument) {
      return
    }

    const pagesToSample = Math.min(pdfDocument.getPageCount(), 2)

    for (let page = 1; page <= pagesToSample; page += 1) {
      const text = await pdfDocument.loadPageText(page)

      if (text.trim().length > 0) {
        return
      }
    }

    useEditorStore
      .getState()
      .setNotice(
        "This PDF has no selectable text. It looks like a scan. Use Make text editable to read the page images, then save."
      )
  } catch (error) {
    console.error("Failed to inspect the PDF text layer:", error)
  }
}
