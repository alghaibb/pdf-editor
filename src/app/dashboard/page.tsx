import { Suspense } from "react"
import type { Metadata } from "next"
import { cacheLife, cacheTag } from "next/cache"
import { redirect } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSession } from "@/lib/auth/session"
import { AUTH_STATE_TAG } from "@/lib/auth/cache-tags"
import { userDocumentsTag } from "@/lib/documents/cache-tags"
import { listUserDocuments } from "@/lib/documents/queries"
import { isR2Configured, getMissingR2EnvNames } from "@/lib/r2/env"
import { DashboardFolioSkeleton } from "@/app/dashboard/_components/dashboard-folio-skeleton"
import { DocumentLibrary } from "@/app/dashboard/_components/document-library"
import { EditorAssetPrefetch } from "@/app/dashboard/_components/editor-asset-prefetch"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your PDF Editor dashboard.",
}

export default function DashboardPage() {
  const storageReady = isR2Configured()
  const missingStorageEnv = getMissingR2EnvNames()

  return (
    <section className="px-5 pb-24 sm:px-8 lg:px-12 lg:pb-32">
      <EditorAssetPrefetch />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
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
        <Suspense fallback={<DashboardFolioSkeleton />}>
          <DashboardDocuments storageReady={storageReady} />
        </Suspense>
      </div>
    </section>
  )
}

async function DashboardDocuments({ storageReady }: { storageReady: boolean }) {
  "use cache: private"
  cacheLife("hours")

  const session = await getSession()

  if (!session) {
    redirect("/sign-in")
  }

  cacheTag(AUTH_STATE_TAG)
  cacheTag(userDocumentsTag(session.user.id))

  const documents = await listUserDocuments(session.user.id)

  return (
    <DocumentLibrary
      userId={session.user.id}
      storageReady={storageReady}
      documents={documents.map((document) => ({
        id: document.id,
        name: document.name,
        updatedAt: document.updatedAt.toISOString(),
      }))}
    />
  )
}
