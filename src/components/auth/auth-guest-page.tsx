import { Suspense, type ReactNode } from "react"

import { redirectIfAuthenticated } from "@/lib/auth/session"

async function AuthGuestGate({ children }: { children: ReactNode }) {
  await redirectIfAuthenticated()
  return children
}

export function AuthGuestPage({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={children}>
      <AuthGuestGate>{children}</AuthGuestGate>
    </Suspense>
  )
}
