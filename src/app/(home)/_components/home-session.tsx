import { cacheLife, cacheTag } from "next/cache"

import { HomeClose } from "@/app/(home)/_components/home-close"
import { HomeFooter } from "@/app/(home)/_components/home-footer"
import { HomeHeader } from "@/app/(home)/_components/home-header"
import { HomeHero } from "@/app/(home)/_components/home-hero"
import { AUTH_STATE_TAG } from "@/lib/auth/cache-tags"
import { getSession } from "@/lib/auth/session"

async function getIsAuthenticated() {
  "use cache: private"
  cacheLife("hours")
  cacheTag(AUTH_STATE_TAG)

  const session = await getSession()
  return Boolean(session)
}

export async function HomeHeaderFromSession() {
  return <HomeHeader isAuthenticated={await getIsAuthenticated()} />
}

export async function HomeHeroFromSession() {
  return <HomeHero isAuthenticated={await getIsAuthenticated()} />
}

export async function HomeCloseFromSession() {
  return <HomeClose isAuthenticated={await getIsAuthenticated()} />
}

export async function HomeFooterFromSession() {
  return <HomeFooter isAuthenticated={await getIsAuthenticated()} />
}
