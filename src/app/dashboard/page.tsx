import type { Metadata } from "next"

import { requireSession } from "@/lib/auth/session"
import { ThemeToggle } from "@/components/theme-toggle"
import { SignOutButton } from "@/app/dashboard/_components/sign-out-button"
import { signOutAction } from "@/app/dashboard/_actions/sign-out"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your PDF Editor dashboard.",
}

export default async function DashboardPage() {
  const session = await requireSession()

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Dashboard
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Welcome, {session.user.name}
          </h1>
          <p className="text-sm text-muted-foreground">{session.user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action={signOutAction}>
            <SignOutButton />
          </form>
        </div>
      </div>
      <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
        Authentication is working. Document upload and editing come next.
      </p>
    </div>
  )
}
