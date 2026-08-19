import Link from "next/link"
import type { Metadata } from "next"

import { AuthGuestPage } from "@/components/auth/auth-guest-page"
import { AuthShell } from "@/components/auth/auth-shell"
import { ForgotPasswordForm } from "@/app/(auth)/forgot-password/_components/forgot-password-form"

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset code.",
}

export default function ForgotPasswordPage() {
  return (
    <AuthGuestPage>
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
    </AuthGuestPage>
  )
}
