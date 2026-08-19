import Link from "next/link"
import type { Metadata } from "next"

import { AuthGuestPage } from "@/components/auth/auth-guest-page"
import { AuthShell } from "@/components/auth/auth-shell"
import { SignUpForm } from "@/app/(auth)/sign-up/_components/sign-up-form"

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a PDF Editor account.",
}

export default function SignUpPage() {
  return (
    <AuthGuestPage>
      <AuthShell
        title="Create account"
        description="Start uploading and editing PDFs in your browser."
        footer={
          <>
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </>
        }
      >
        <SignUpForm />
      </AuthShell>
    </AuthGuestPage>
  )
}
