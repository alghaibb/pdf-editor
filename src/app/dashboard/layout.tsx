import { Suspense } from "react"
import { cacheLife, cacheTag } from "next/cache"
import { redirect } from "next/navigation"

import { getSession } from "@/lib/auth/session"
import { AUTH_STATE_TAG } from "@/lib/auth/cache-tags"
import { DashboardHeader } from "@/app/dashboard/_components/dashboard-header"
import {
  DashboardHero,
  firstNameFrom,
} from "@/app/dashboard/_components/dashboard-hero"

async function DashboardHeaderFromSession() {
  "use cache: private"
  cacheLife("hours")
  cacheTag(AUTH_STATE_TAG)

  const session = await getSession()

  if (!session) {
    redirect("/sign-in")
  }

  return (
    <DashboardHeader
      userName={session.user.name}
      userEmail={session.user.email}
    />
  )
}

async function DashboardHeroFromSession() {
  "use cache: private"
  cacheLife("hours")
  cacheTag(AUTH_STATE_TAG)

  const session = await getSession()

  if (!session) {
    redirect("/sign-in")
  }

  return <DashboardHero firstName={firstNameFrom(session.user.name)} />
}

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-background">
      <Suspense fallback={<DashboardHeader />}>
        <DashboardHeaderFromSession />
      </Suspense>
      <main className="flex flex-1 flex-col">
        <Suspense fallback={<DashboardHero />}>
          <DashboardHeroFromSession />
        </Suspense>
        {children}
      </main>
    </div>
  )
}
