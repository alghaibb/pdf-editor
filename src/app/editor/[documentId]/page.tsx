import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { requireSession } from "@/lib/auth/session"
import { getOwnedDocument } from "@/lib/documents/queries"
import { createCurrentPdfDownloadUrl } from "@/lib/r2/objects"
import { documentIdSchema } from "@/schemas/documents"
import { EditorLoading } from "./_components/editor-loading"
import { PdfEditor } from "./_components/pdf-editor"

export const metadata: Metadata = {
  title: "Editor",
  description: "Edit existing PDF text in the browser.",
}

export default function EditorDocumentPage(
  props: PageProps<"/editor/[documentId]">
) {
  return (
    <Suspense fallback={<EditorLoading />}>
      <EditorDocument {...props} />
    </Suspense>
  )
}

async function EditorDocument({
  params,
}: PageProps<"/editor/[documentId]">) {
  const session = await requireSession()
  const { documentId } = await params
  const parsedId = documentIdSchema.safeParse(documentId)

  if (!parsedId.success) {
    notFound()
  }

  const document = await getOwnedDocument(parsedId.data, session.user.id)

  if (!document || document.currentVersion < 1) {
    notFound()
  }

  let downloadUrl: string

  try {
    downloadUrl = await createCurrentPdfDownloadUrl(
      document.storageKey,
      document.name
    )
  } catch (error) {
    console.error("Failed to create PDF download URL:", error)
    throw error
  }

  return (
    <PdfEditor
      documentId={document.id}
      fileName={document.name}
      downloadUrl={downloadUrl}
      licenseKey={process.env.APRYSE_LICENSE_KEY}
    />
  )
}
