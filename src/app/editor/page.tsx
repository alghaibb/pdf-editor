import { redirect } from "next/navigation"

import { requireSession } from "@/lib/auth/session"

export default async function EditorIndexPage() {
  await requireSession()
  redirect("/dashboard")
}
