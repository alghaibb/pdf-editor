import type { Metadata } from "next"
import Link from "next/link"

import { SignOutButton } from "@/components/sign-out-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { signOutAction } from "@/lib/auth/actions"
import { requireSession } from "@/lib/auth/session"
import { listUserDocuments } from "@/lib/documents/queries"
import { isR2Configured, getMissingR2EnvNames } from "@/lib/r2/env"
import { DashboardIndex } from "@/app/dashboard/_components/dashboard-index"
import { DocumentList } from "@/app/dashboard/_components/document-list"
import { EmptyDocuments } from "@/app/dashboard/_components/empty-documents"
import { UploadDocumentButton } from "@/app/dashboard/_components/upload-document-button"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your PDF Editor dashboard.",
}

export default async function DashboardPage() {
  const session = await requireSession()
  const documents = await listUserDocuments(session.user.id)
  const storageReady = isR2Configured()
  const missingStorageEnv = getMissingR2EnvNames()

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <div className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-2">
          <Link
            href="/"
            className="font-heading w-fit text-xs font-semibold tracking-[0.22em] uppercase"
          >
            PDF Editor
          </Link>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Welcome, {session.user.name}
          </h1>
          <p className="text-sm text-muted-foreground">{session.user.email}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/"
              className="text-xs font-semibold tracking-widest text-muted-foreground uppercase underline-offset-4 hover:text-foreground hover:underline"
            >
              Home
            </Link>
            <ThemeToggle />
            <form action={signOutAction}>
              <SignOutButton />
            </form>
          </div>
          <div className="md:hidden">
            <DashboardIndex
              userName={session.user.name}
              userEmail={session.user.email}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Documents
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Upload a PDF, edit the real text in the editor, then save and reopen
            it to confirm your changes persisted.
          </p>
        </div>
        {storageReady ? null : (
          <Alert>
            <AlertTitle>File storage is not configured</AlertTitle>
            <AlertDescription>
              Missing {missingStorageEnv.join(", ")}. Restart the dev server
              after changing .env. The R2 bucket also needs CORS allowing PUT
              and GET from this app.
            </AlertDescription>
          </Alert>
        )}
        <UploadDocumentButton disabled={!storageReady} />
        {documents.length === 0 ? (
          <EmptyDocuments />
        ) : (
          <DocumentList documents={documents} />
        )}
      </div>
    </div>
  )
}
