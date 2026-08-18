import { MAX_PDF_SIZE_BYTES, PDF_MAGIC } from "@/lib/pdf/constants"

export type PdfFileErrorCode =
  | "NOT_PDF"
  | "TOO_LARGE"
  | "EMPTY"
  | "UNREADABLE"

export class PdfFileError extends Error {
  code: PdfFileErrorCode

  constructor(code: PdfFileErrorCode, message: string) {
    super(message)
    this.name = "PdfFileError"
    this.code = code
  }
}

export function pdfFileErrorMessage(code: PdfFileErrorCode): string {
  switch (code) {
    case "NOT_PDF":
      return "That file is not a valid PDF."
    case "TOO_LARGE":
      return "That PDF is too large. Use a file of 50 MB or less."
    case "EMPTY":
      return "Choose a PDF file to upload."
    case "UNREADABLE":
      return "The file could not be read."
  }
}

export async function assertPdfFile(file: File): Promise<void> {
  if (file.size === 0) {
    throw new PdfFileError("EMPTY", pdfFileErrorMessage("EMPTY"))
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    throw new PdfFileError("TOO_LARGE", pdfFileErrorMessage("TOO_LARGE"))
  }

  try {
    const headerBytes = await file.slice(0, 4).arrayBuffer()
    const header = new TextDecoder().decode(headerBytes)

    if (!header.startsWith(PDF_MAGIC)) {
      throw new PdfFileError("NOT_PDF", pdfFileErrorMessage("NOT_PDF"))
    }
  } catch (error) {
    if (error instanceof PdfFileError) {
      throw error
    }

    console.error("Failed to read PDF file header:", error)
    throw new PdfFileError("UNREADABLE", pdfFileErrorMessage("UNREADABLE"))
  }
}
