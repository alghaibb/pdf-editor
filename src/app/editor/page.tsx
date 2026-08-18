import type { Metadata } from "next"

import { requireSession } from "@/lib/auth/session"
import { PdfEditor } from "@/app/editor/_components/pdf-editor"

export const metadata: Metadata = {
  title: "Editor",
  description: "Edit existing PDF text in the browser.",
}

export default async function EditorPage() {
  await requireSession()

  return <PdfEditor licenseKey={process.env.APRYSE_LICENSE_KEY} />
}
