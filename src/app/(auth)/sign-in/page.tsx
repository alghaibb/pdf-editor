import Link from "next/link"
import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { SignInForm } from "@/app/(auth)/sign-in/_components/sign-in-form"
import { redirectIfAuthenticated } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your PDF Editor account.",
}

export default async function SignInPage() {
  await redirectIfAuthenticated()

  return (
    <AuthShell
      title="Sign in"
      description="Access your documents and continue editing."
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
      <SignInForm />
    </AuthShell>
  )
}
