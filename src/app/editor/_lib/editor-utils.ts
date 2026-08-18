import type { WebViewerInstance } from "@pdftron/webviewer"

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
