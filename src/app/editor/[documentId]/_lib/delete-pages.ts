import type { Core, WebViewerInstance } from "@pdftron/webviewer"

type RemovableDocument = {
  removePages: (pageArray: number[]) => Promise<unknown>
  getPageCount: () => number
}

export class LastPageError extends Error {
  constructor() {
    super("The last page cannot be deleted.")
    this.name = "LastPageError"
  }
}

export type CurrentPageInfo = {
  page: number
  pageCount: number
}

export function getCurrentPageInfo(
  instance: WebViewerInstance
): CurrentPageInfo | null {
  const { documentViewer } = instance.Core
  const document = documentViewer.getDocument()

  if (!document) {
    return null
  }

  return {
    page: documentViewer.getCurrentPage(),
    pageCount: document.getPageCount(),
  }
}

export async function removeCurrentPage(instance: WebViewerInstance) {
  const info = getCurrentPageInfo(instance)

  if (!info) {
    throw new Error("No document is loaded.")
  }

  if (info.pageCount <= 1) {
    throw new LastPageError()
  }

  const document = instance.Core.documentViewer.getDocument()

  if (!document) {
    throw new Error("No document is loaded.")
  }

  await asRemovableDocument(document).removePages([info.page])
  return info
}

function asRemovableDocument(document: Core.Document): RemovableDocument {
  const candidate = document as Core.Document & Partial<RemovableDocument>

  if (typeof candidate.removePages !== "function") {
    throw new Error("This PDF cannot remove pages.")
  }

  return candidate as RemovableDocument
}
