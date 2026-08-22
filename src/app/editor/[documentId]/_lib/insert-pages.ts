import type { Core, WebViewerInstance } from "@pdftron/webviewer"

import { assertPdfFile } from "@/lib/pdf/file"

type InsertableDocument = {
  insertPages: (
    sourceDocument: Core.Document,
    pageArray?: number[],
    insertBeforeThisPage?: number
  ) => Promise<unknown>
}

type CoreWithCreateDocument = {
  createDocument: (
    src: File,
    options: { filename: string; extension: string }
  ) => Promise<Core.Document>
}

export async function insertPagesFromPdfFile(
  instance: WebViewerInstance,
  file: File
) {
  await assertPdfFile(file)

  const current = instance.Core.documentViewer.getDocument()

  if (!current) {
    throw new Error("No document is loaded.")
  }

  const insertable = asInsertableDocument(current)
  const createDocument = getCreateDocument(instance.Core)
  const source = await createDocument(file, {
    filename: file.name,
    extension: "pdf",
  })

  await insertable.insertPages(source)
}

function asInsertableDocument(document: Core.Document): InsertableDocument {
  const candidate = document as Core.Document & Partial<InsertableDocument>

  if (typeof candidate.insertPages !== "function") {
    throw new Error("This PDF cannot accept inserted pages.")
  }

  return candidate as InsertableDocument
}

function getCreateDocument(core: WebViewerInstance["Core"]) {
  const candidate = core as WebViewerInstance["Core"] &
    Partial<CoreWithCreateDocument>

  if (typeof candidate.createDocument !== "function") {
    throw new Error("The editor cannot open the selected PDF.")
  }

  return candidate.createDocument.bind(candidate)
}
