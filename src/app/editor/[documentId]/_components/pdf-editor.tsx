"use client"

import { useEffect, useRef, useState } from "react"
import { preconnect } from "react-dom"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useEditorStore } from "@/stores/editor-store"
import { EditorToolbar } from "./editor-toolbar"
import { useAutosave } from "../_hooks/use-autosave"
import { useEditorKeyboardShortcuts } from "../_hooks/use-editor-keyboard-shortcuts"
import { useWebViewer } from "../_hooks/use-webviewer"
import {
  clearRecoveryStash,
  getRecoveryStash,
  type RecoveryStash,
} from "../_lib/recovery"

type PdfEditorProps = {
  documentId: string
  fileName: string
  downloadUrl: string
  currentVersion: number
  licenseKey?: string
}

export function PdfEditor({
  documentId,
  fileName,
  downloadUrl,
  currentVersion,
  licenseKey,
}: PdfEditorProps) {
  // Warm DNS + TLS to the R2 origin now; WebViewer fetches the PDF from it
  // only after its own scripts boot, so the handshake is off the critical path.
  preconnect(new URL(downloadUrl).origin, { crossOrigin: "anonymous" })

  const viewerRef = useRef<HTMLDivElement>(null)
  const { saveDocument, downloadPdf, loadRecoveredPdf } = useWebViewer(
    viewerRef,
    {
      licenseKey,
      documentId,
      fileName,
      downloadUrl,
      onSaveShortcut: () => void handleSave(),
    }
  )
  const isReady = useEditorStore((state) => state.isReady)
  const errorMessage = useEditorStore((state) => state.errorMessage)
  const noticeMessage = useEditorStore((state) => state.noticeMessage)

  const [recoveryStash, setRecoveryStash] = useState<RecoveryStash | null>(
    null
  )
  // isReady flips again when recovered bytes reload, so remember that the
  // stash was already offered instead of showing the banner twice.
  const isRecoveryHandledRef = useRef(false)

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

  async function handleAutosave() {
    try {
      await saveDocument()
    } catch (error) {
      console.error("Autosave failed:", error)
      toast.error("Autosave failed. Your latest edits are not saved yet.")
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
  useAutosave(() => void handleAutosave())

  useEffect(() => {
    if (!isReady || isRecoveryHandledRef.current) {
      return
    }

    let isCancelled = false

    getRecoveryStash(documentId)
      .then((stash) => {
        if (isCancelled || !stash) {
          return
        }

        // A newer save already reached the server (for example from
        // another tab), so the local copy is stale.
        if (
          stash.targetVersion !== undefined &&
          currentVersion >= stash.targetVersion
        ) {
          void clearRecoveryStash(documentId).catch((error: unknown) => {
            console.error("Failed to drop a stale recovery stash:", error)
          })
          return
        }

        setRecoveryStash(stash)
      })
      .catch((error: unknown) => {
        console.error("Failed to check for recovered edits:", error)
      })

    return () => {
      isCancelled = true
    }
  }, [documentId, currentVersion, isReady])

  function handleRestoreRecovery() {
    if (!recoveryStash) {
      return
    }

    isRecoveryHandledRef.current = true

    try {
      loadRecoveredPdf(recoveryStash.blob)
      // The stash stays in IndexedDB until the restored edits actually
      // save, in case this session also ends abruptly.
      setRecoveryStash(null)
    } catch (error) {
      console.error("Failed to restore recovered edits:", error)
      toast.error("Could not restore the recovered edits.")
    }
  }

  function handleDiscardRecovery() {
    if (!recoveryStash) {
      return
    }

    isRecoveryHandledRef.current = true
    setRecoveryStash(null)

    void clearRecoveryStash(documentId).catch((error: unknown) => {
      console.error("Failed to discard recovered edits:", error)
    })
  }

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
        {noticeMessage && !errorMessage ? (
          <div className="absolute top-4 right-4 left-4 z-20 md:left-auto md:w-96">
            <Alert>
              <AlertTitle>About this document</AlertTitle>
              <AlertDescription>
                {noticeMessage}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 self-start"
                  onClick={() =>
                    useEditorStore.getState().setNotice(null)
                  }
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : null}
        {recoveryStash ? (
          <div className="absolute top-4 left-1/2 z-30 w-[min(92%,28rem)] -translate-x-1/2">
            <Alert>
              <AlertTitle>Recovered unsaved edits</AlertTitle>
              <AlertDescription>
                A previous session left edits from{" "}
                {formatDistanceToNow(recoveryStash.updatedAt, {
                  addSuffix: true,
                })}{" "}
                that were never saved. Restore them?
                <span className="mt-2 flex gap-2">
                  <Button type="button" size="sm" onClick={handleRestoreRecovery}>
                    Restore
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDiscardRecovery}
                  >
                    Discard
                  </Button>
                </span>
              </AlertDescription>
            </Alert>
          </div>
        ) : null}
        {/* WebViewer refuses to initialize into an element that already
            hosts an instance, and disposal is async, so every document gets
            a fresh element. The key must not include the download URL:
            restores re-sign it and swap the document into the running
            viewer instead of remounting. */}
        <div
          key={documentId}
          ref={viewerRef}
          className="h-full min-h-0 w-full min-w-0"
        />
      </div>
    </div>
  )
}
