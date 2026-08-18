import "server-only"

import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

/**
 * Request-scoped session lookup.
 * React `cache()` ensures layout/page/components share one getSession call
 * per request instead of hitting the DB repeatedly.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  })
})

export async function requireSession() {
  const session = await getSession()

  if (!session) {
    redirect("/sign-in")
  }

  return session
}

export async function redirectIfAuthenticated(path = "/dashboard") {
  const session = await getSession()

  if (session) {
    redirect(path)
  }
}
