import Link from "next/link"
import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { SignUpForm } from "@/app/(auth)/sign-up/_components/sign-up-form"
import { redirectIfAuthenticated } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a PDF Editor account.",
}

export default async function SignUpPage() {
  await redirectIfAuthenticated()

  return (
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
  )
}
