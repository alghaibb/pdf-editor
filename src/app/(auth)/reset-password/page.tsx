import Link from "next/link"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { ResetPasswordForm } from "@/app/(auth)/reset-password/_components/reset-password-form"
import { redirectIfAuthenticated } from "@/lib/auth/session"
import { emailSchema } from "@/schemas/auth/shared"

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your account.",
}

type ResetPasswordPageProps = {
  searchParams: Promise<{ email?: string }>
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  await redirectIfAuthenticated()

  const params = await searchParams
  const parsedEmail = emailSchema.safeParse(params.email)

  if (!parsedEmail.success) {
    redirect("/forgot-password")
  }

  return (
    <AuthShell
      title="Reset password"
      description="Enter the code from your email and choose a new password."
      footer={
        <>
          Need a new code?{" "}
          <Link
            href="/forgot-password"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Request another
          </Link>
        </>
      }
    >
      <ResetPasswordForm email={parsedEmail.data} />
    </AuthShell>
  )
}
