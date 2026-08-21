import type { WebViewerInstance } from "@pdftron/webviewer"

import { useEditorStore } from "@/stores/editor-store"

/**
 * Shared between the window listener and the WebViewer iframe listener,
 * since keydown events inside the iframe never bubble to the parent window.
 * The browser save dialog is always suppressed in the editor, even when
 * there is nothing to save.
 */
export function handleSaveShortcutEvent(
  event: KeyboardEvent,
  onSave: () => void
) {
  if (!(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey) {
    return
  }

  if (event.key.toLowerCase() !== "s") {
    return
  }

  event.preventDefault()

  const { isReady, isDirty, isSaving, isFinalizing, isDownloading } =
    useEditorStore.getState()

  if (!isReady || !isDirty || isSaving || isFinalizing || isDownloading) {
    return
  }

  onSave()
}

export async function exportPdfBlob(
  instance: WebViewerInstance
): Promise<Blob> {
  const { documentViewer, annotationManager } = instance.Core
  const document = documentViewer.getDocument()

  if (!document) {
    throw new Error("No document is loaded.")
  }

  const xfdfString = await annotationManager.exportAnnotations()
  const data = await document.getFileData({
    xfdfString,
    includeAnnotations: true,
  })

  return new Blob([new Uint8Array(data)], { type: "application/pdf" })
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
