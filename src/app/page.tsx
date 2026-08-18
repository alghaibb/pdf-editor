import type { Metadata } from "next"
import Link from "next/link"

import { getSession } from "@/lib/auth/session"
import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "PDF Editor",
  description: "Edit real PDF content in your browser.",
}

export default async function HomePage() {
  const session = await getSession()

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--muted)_0%,transparent_55%)] opacity-80" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,transparent_49%,color-mix(in_oklch,var(--border)_55%,transparent)_50%,transparent_51%),linear-gradient(to_bottom,transparent_0%,transparent_49%,color-mix(in_oklch,var(--border)_55%,transparent)_50%,transparent_51%)] bg-size-[48px_48px] opacity-30" />
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <p className="font-heading text-sm font-semibold tracking-[0.2em] uppercase">
          PDF Editor
        </p>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "glow" }))}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className={cn(buttonVariants({ variant: "ghost" }))}
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className={cn(buttonVariants({ variant: "glow" }))}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="relative z-10 flex flex-1 flex-col justify-center px-6 pb-20 md:px-10">
        <div className="flex max-w-2xl flex-col gap-6">
          <h1 className="font-heading text-5xl leading-tight font-semibold tracking-tight text-foreground md:text-6xl">
            PDF Editor
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
            Open existing PDFs, edit real text content, and save your changes
            securely.
          </p>
          <div className="flex flex-wrap gap-3">
            {session ? (
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ size: "lg", variant: "glow" }))}
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-up"
                  className={cn(buttonVariants({ size: "lg", variant: "glow" }))}
                >
                  Create account
                </Link>
                <Link
                  href="/sign-in"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" })
                  )}
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
