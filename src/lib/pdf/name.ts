import { MAX_DOCUMENT_NAME_LENGTH } from "@/lib/pdf/constants"

export function sanitizeDocumentName(rawName: string): string {
  const basename = rawName.replaceAll("\\", "/").split("/").pop()?.trim() ?? ""
  const withoutControlChars = basename.replace(/[\u0000-\u001F\u007F]/g, "")
  const collapsed = withoutControlChars.replace(/\s+/g, " ").trim()
  const clipped = collapsed.slice(0, MAX_DOCUMENT_NAME_LENGTH).trim()
  const fallback = clipped.length > 0 ? clipped : "document.pdf"

  if (fallback.toLowerCase().endsWith(".pdf")) {
    return fallback
  }

  const withExtension = `${fallback}.pdf`
  return withExtension.slice(0, MAX_DOCUMENT_NAME_LENGTH)
}

export function asciiContentDispositionName(name: string): string {
  return name.replace(/[^\x20-\x7E]/g, "_").replaceAll('"', "")
}
