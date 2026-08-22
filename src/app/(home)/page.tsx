import { Suspense } from "react"
import type { Metadata } from "next"

import { HomeClose } from "@/app/(home)/_components/home-close"
import { HomeFooter } from "@/app/(home)/_components/home-footer"
import { HomeHeader } from "@/app/(home)/_components/home-header"
import { HomeHero } from "@/app/(home)/_components/home-hero"
import { HomeCapabilities } from "@/app/(home)/_components/home-capabilities"
import { HomeProof } from "@/app/(home)/_components/home-proof"
import {
  HomeCloseFromSession,
  HomeFooterFromSession,
  HomeHeaderFromSession,
  HomeHeroFromSession,
} from "@/app/(home)/_components/home-session"
import { HomeSteps } from "@/app/(home)/_components/home-steps"

export const metadata: Metadata = {
  title: "Edit the PDF itself",
  description:
    "Rewrite existing PDF text in the browser, save the actual file, and reopen it with the change still there.",
}

export default function HomePage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-background">
      <div className="relative z-10 flex min-h-full flex-1 flex-col">
        <Suspense fallback={<HomeHeader isAuthenticated={false} />}>
          <HomeHeaderFromSession />
        </Suspense>
        <main className="flex flex-1 flex-col">
          <Suspense fallback={<HomeHero isAuthenticated={false} />}>
            <HomeHeroFromSession />
          </Suspense>
          <HomeCapabilities />
          <HomeProof />
          <HomeSteps />
          <Suspense fallback={<HomeClose isAuthenticated={false} />}>
            <HomeCloseFromSession />
          </Suspense>
        </main>
        <Suspense fallback={<HomeFooter isAuthenticated={false} />}>
          <HomeFooterFromSession />
        </Suspense>
      </div>
    </div>
  )
}
