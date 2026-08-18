import { PDF_MAGIC } from "@/lib/pdf/constants"

export function hasPdfMagic(bytes: Uint8Array): boolean {
  const header = new TextDecoder().decode(bytes.slice(0, PDF_MAGIC.length))
  return header.startsWith(PDF_MAGIC)
}
