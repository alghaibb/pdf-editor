import { Suspense } from "react"
import { redirect } from "next/navigation"

import { requireSession } from "@/lib/auth/session"

export default function EditorIndexPage() {
  return (
    <Suspense>
      <EditorIndexRedirect />
    </Suspense>
  )
}

async function EditorIndexRedirect() {
  await requireSession()
  redirect("/dashboard")
}
