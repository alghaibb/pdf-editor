import Link from "next/link"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { VerifyEmailForm } from "@/app/(auth)/verify-email/_components/verify-email-form"
import { redirectIfAuthenticated } from "@/lib/auth/session"
import { emailSchema } from "@/schemas/auth/shared"

export const metadata: Metadata = {
  title: "Verify email",
  description: "Verify your email address to continue.",
}

type VerifyEmailPageProps = {
  searchParams: Promise<{ email?: string }>
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  await redirectIfAuthenticated()

  const params = await searchParams
  const parsedEmail = emailSchema.safeParse(params.email)

  if (!parsedEmail.success) {
    redirect("/sign-up")
  }

  return (
    <AuthShell
      title="Verify email"
      description="Enter the verification code we sent to your inbox."
      footer={
        <>
          Wrong email?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create a different account
          </Link>
        </>
      }
    >
      <VerifyEmailForm email={parsedEmail.data} />
    </AuthShell>
  )
}
