import type { Metadata } from "next"

import { HomeClose } from "@/app/(home)/_components/home-close"
import { HomeFooter } from "@/app/(home)/_components/home-footer"
import { HomeHeader } from "@/app/(home)/_components/home-header"
import { HomeHero } from "@/app/(home)/_components/home-hero"
import { HomeProof } from "@/app/(home)/_components/home-proof"
import { HomeSteps } from "@/app/(home)/_components/home-steps"
import { getSession } from "@/lib/auth/session"

export const metadata: Metadata = {
  description: "Edit real PDF text in the browser, then save the actual file.",
}

export const instant = false

export default async function HomePage() {
  const session = await getSession()
  const isAuthenticated = Boolean(session)

  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-background">
      <div className="relative z-10 flex min-h-full flex-1 flex-col">
        <HomeHeader isAuthenticated={isAuthenticated} />
        <main className="flex flex-1 flex-col">
          <HomeHero isAuthenticated={isAuthenticated} />
          <HomeProof />
          <HomeSteps />
          <HomeClose isAuthenticated={isAuthenticated} />
        </main>
        <HomeFooter isAuthenticated={isAuthenticated} />
      </div>
    </div>
  )
}
