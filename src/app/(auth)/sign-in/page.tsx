import { Suspense } from "react"
import Link from "next/link"
import type { Metadata } from "next"

import { AuthGuestPage } from "@/components/auth/auth-guest-page"
import { AuthMethods } from "@/components/auth/auth-methods"
import { AuthShell } from "@/components/auth/auth-shell"
import { SignInForm } from "@/app/(auth)/sign-in/_components/sign-in-form"
import { isGoogleAuthConfigured } from "@/lib/auth/google"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your PDF Editor account.",
}

type SignInPageProps = {
  searchParams: Promise<{ error?: string }>
}

function SignInShell({
  googleEnabled,
  error,
}: {
  googleEnabled: boolean
  error?: string
}) {
  return (
    <AuthShell
      title="Sign in"
      description={
        googleEnabled
          ? "Continue with Google, or use the email on your account."
          : "Access your documents and continue editing."
      }
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <AuthMethods googleEnabled={googleEnabled} error={error}>
        <SignInForm />
      </AuthMethods>
    </AuthShell>
  )
}

export default function SignInPage({ searchParams }: SignInPageProps) {
  const googleEnabled = isGoogleAuthConfigured()

  return (
    <AuthGuestPage>
      <Suspense fallback={<SignInShell googleEnabled={googleEnabled} />}>
        <SignInContent
          googleEnabled={googleEnabled}
          searchParams={searchParams}
        />
      </Suspense>
    </AuthGuestPage>
  )
}

async function SignInContent({
  googleEnabled,
  searchParams,
}: {
  googleEnabled: boolean
  searchParams: SignInPageProps["searchParams"]
}) {
  const params = await searchParams

  return (
    <SignInShell googleEnabled={googleEnabled} error={params.error} />
  )
}
