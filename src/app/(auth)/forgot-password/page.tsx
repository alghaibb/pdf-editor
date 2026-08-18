import Link from "next/link"
import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { ForgotPasswordForm } from "@/app/(auth)/forgot-password/_components/forgot-password-form"
import { redirectIfAuthenticated } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset code.",
}

export default async function ForgotPasswordPage() {
  await redirectIfAuthenticated()

  return (
    <AuthShell
      title="Forgot password"
      description="Enter your email and we'll send a one-time reset code."
      footer={
        <>
          Remembered your password?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
