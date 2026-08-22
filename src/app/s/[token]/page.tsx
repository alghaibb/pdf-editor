import { Suspense, type ReactNode } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { format } from "date-fns"

import { buttonVariants } from "@/components/ui/button"
import { getSharePageState } from "@/lib/documents/queries"
import { cn } from "@/lib/utils"
import { shareTokenSchema } from "@/schemas/documents"

export const metadata: Metadata = {
  title: "Download",
  description: "Download a shared PDF.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function SharedDocumentPage(props: PageProps<"/s/[token]">) {
  return (
    <Suspense
      fallback={
        <ShareFrame>
          <p className="text-sm text-muted-foreground">Checking the link…</p>
        </ShareFrame>
      }
    >
      <SharedDocument {...props} />
    </Suspense>
  )
}

async function SharedDocument({ params }: PageProps<"/s/[token]">) {
  const { token } = await params
  const parsedToken = shareTokenSchema.safeParse(token)

  if (!parsedToken.success) {
    notFound()
  }

  const share = await getSharePageState(parsedToken.data)

  if (!share) {
    notFound()
  }

  return (
    <ShareFrame>
      <p className="text-[11px] font-semibold tracking-[0.28em] text-muted-foreground uppercase">
        Shared file
      </p>
      <h1 className="font-heading mt-3 text-3xl font-semibold tracking-tight">
        {share.isExpired ? "This link has expired" : share.name}
      </h1>
      {share.isExpired ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Ask the sender for a new download link.
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            This is a download-only copy of the latest saved file. It expires{" "}
            {format(share.expiresAt, "dd/MM/yyyy h:mm a")}.
          </p>
          <a
            href={`/api/s/${parsedToken.data}`}
            className={cn(buttonVariants(), "mt-8")}
          >
            Download PDF
          </a>
        </>
      )}
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "ghost" }), "mt-4")}
      >
        Home
      </Link>
    </ShareFrame>
  )
}

function ShareFrame({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-md flex-col items-start border border-border px-8 py-10">
        {children}
      </div>
    </main>
  )
}
