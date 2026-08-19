import Link from "next/link"
import type { Metadata } from "next"

import { AuthGuestPage } from "@/components/auth/auth-guest-page"
import { AuthShell } from "@/components/auth/auth-shell"
import { SignInForm } from "@/app/(auth)/sign-in/_components/sign-in-form"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your PDF Editor account.",
}

export default function SignInPage() {
  return (
    <AuthGuestPage>
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
    </AuthGuestPage>
  )
}
