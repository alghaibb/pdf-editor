import type { Core, WebViewerInstance } from "@pdftron/webviewer"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import Tesseract from "tesseract.js"

import { exportPdfBlob } from "./editor-utils"

const MIN_WORD_CONFIDENCE = 40
const CANVAS_ZOOM = 2

type CanvasDocument = {
  getPageCount: () => number
  loadPageText: (pageNumber: number) => Promise<string>
  loadCanvas: (options: {
    pageNumber: number
    zoom?: number
    drawComplete: (canvas: unknown) => void
  }) => unknown
}

export class OcrError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OcrError"
  }
}

export type OcrProgress = {
  page: number
  pageCount: number
}

/**
 * Reads page images for pages that have no text layer and writes an
 * invisible PDF text layer in place. The original page images stay as they
 * are; this is a real text layer, not a covering box.
 */
export async function recognizeScannedPages(
  instance: WebViewerInstance,
  onProgress?: (progress: OcrProgress) => void
): Promise<Blob> {
  const loadedDocument = instance.Core.documentViewer.getDocument()

  if (!loadedDocument) {
    throw new OcrError("No document is loaded.")
  }

  const pdfDocument = asCanvasDocument(loadedDocument)
  const pageCount = pdfDocument.getPageCount()
  const pagesToRead: number[] = []

  for (let page = 1; page <= pageCount; page += 1) {
    const text = await pdfDocument.loadPageText(page)

    if (text.trim().length === 0) {
      pagesToRead.push(page)
    }
  }

  if (pagesToRead.length === 0) {
    throw new OcrError("This PDF already has selectable text.")
  }

  const worker = await Tesseract.createWorker("eng")

  try {
    const exported = await exportPdfBlob(instance)
    const pdf = await PDFDocument.load(await exported.arrayBuffer())
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    let wordCount = 0

    for (const pageNumber of pagesToRead) {
      onProgress?.({ page: pageNumber, pageCount })

      const canvas = await renderPageCanvas(pdfDocument, pageNumber)
      const result = await worker.recognize(canvas)
      const page = pdf.getPage(pageNumber - 1)
      const { width: pageWidth, height: pageHeight } = page.getSize()
      const scaleX = pageWidth / canvas.width
      const scaleY = pageHeight / canvas.height

      for (const word of collectWords(result.data)) {
        const text = word.text.trim()

        if (!text || word.confidence < MIN_WORD_CONFIDENCE) {
          continue
        }

        const boxHeight = Math.max(word.bbox.y1 - word.bbox.y0, 1)
        const boxWidth = Math.max(word.bbox.x1 - word.bbox.x0, 1)
        const size = Math.max(Math.min(boxHeight * scaleY, 72), 4)
        const x = word.bbox.x0 * scaleX
        const y = pageHeight - word.bbox.y1 * scaleY

        page.drawText(text, {
          x,
          y,
          size,
          font,
          color: rgb(0, 0, 0),
          opacity: 0,
          maxWidth: boxWidth * scaleX,
        })
        wordCount += 1
      }
    }

    if (wordCount === 0) {
      throw new OcrError("No text could be read from the page images.")
    }

    const bytes = await pdf.save()
    return new Blob([Uint8Array.from(bytes)], { type: "application/pdf" })
  } finally {
    await worker.terminate()
  }
}

function collectWords(page: Tesseract.Page): Tesseract.Word[] {
  return (
    page.blocks?.flatMap((block) =>
      block.paragraphs.flatMap((paragraph) =>
        paragraph.lines.flatMap((line) => line.words)
      )
    ) ?? []
  )
}

function asCanvasDocument(document: Core.Document): CanvasDocument {
  const candidate = document as Core.Document & Partial<CanvasDocument>

  if (typeof candidate.loadCanvas !== "function") {
    throw new OcrError("The page image could not be rendered.")
  }

  return candidate as CanvasDocument
}

function renderPageCanvas(
  pdfDocument: CanvasDocument,
  pageNumber: number
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    try {
      pdfDocument.loadCanvas({
        pageNumber,
        zoom: CANVAS_ZOOM,
        drawComplete: (canvas) => {
          if (canvas instanceof HTMLCanvasElement) {
            resolve(canvas)
            return
          }

          reject(new OcrError("The page image could not be rendered."))
        },
      })
    } catch (error) {
      reject(error)
    }
  })
}
