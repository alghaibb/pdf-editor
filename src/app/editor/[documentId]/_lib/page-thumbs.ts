import type { Core, WebViewerInstance } from "@pdftron/webviewer"

type ThumbnailDocument = {
  loadThumbnail: (
    pageNumber: number,
    onLoadThumbnail: (thumbnail: unknown) => void
  ) => unknown
}

export function goToPage(instance: WebViewerInstance, page: number) {
  instance.Core.documentViewer.setCurrentPage(page, false)
}

export async function loadPageThumbnail(
  instance: WebViewerInstance,
  page: number
): Promise<string> {
  const document = instance.Core.documentViewer.getDocument()

  if (!document) {
    throw new Error("No document is loaded.")
  }

  const loader = asThumbnailDocument(document)

  return new Promise((resolve, reject) => {
    try {
      loader.loadThumbnail(page, (thumbnail) => {
        if (thumbnail instanceof HTMLCanvasElement) {
          resolve(thumbnail.toDataURL("image/jpeg", 0.72))
          return
        }

        if (thumbnail instanceof HTMLImageElement) {
          resolve(thumbnail.src)
          return
        }

        reject(new Error("The page thumbnail could not be rendered."))
      })
    } catch (error) {
      reject(error)
    }
  })
}

export async function rotatePage(
  instance: WebViewerInstance,
  page: number
) {
  const document = instance.Core.documentViewer.getDocument()

  if (!document) {
    throw new Error("No document is loaded.")
  }

  const rotatable = document as Core.Document & {
    rotatePages?: (
      pageArray: number[],
      rotation: unknown
    ) => Promise<unknown>
  }

  if (typeof rotatable.rotatePages !== "function") {
    throw new Error("This PDF cannot rotate pages.")
  }

  const rotation = (
    instance.Core as typeof instance.Core & {
      PageRotation?: { E_90?: unknown }
    }
  ).PageRotation?.E_90

  await rotatable.rotatePages([page], rotation ?? 1)
}

function asThumbnailDocument(document: Core.Document): ThumbnailDocument {
  const candidate = document as Core.Document & Partial<ThumbnailDocument>

  if (typeof candidate.loadThumbnail !== "function") {
    throw new Error("This PDF cannot render page thumbnails.")
  }

  return candidate as ThumbnailDocument
}
