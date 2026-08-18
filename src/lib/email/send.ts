import "server-only"

import { Resend } from "resend"

import {
  buildEmailVerificationOtpEmail,
  buildPasswordResetOtpEmail,
  buildSignInOtpEmail,
} from "@/lib/email/templates"

type OtpEmailType =
  | "sign-in"
  | "email-verification"
  | "forget-password"
  | "change-email"

type SendAuthOtpEmailInput = {
  email: string
  otp: string
  type: OtpEmailType
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return null
  }
  return new Resend(apiKey)
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? "PDF Editor <onboarding@resend.dev>"
}

function getTemplate(type: OtpEmailType, otp: string) {
  switch (type) {
    case "email-verification":
    case "change-email":
      return buildEmailVerificationOtpEmail(otp)
    case "forget-password":
      return buildPasswordResetOtpEmail(otp)
    case "sign-in":
      return buildSignInOtpEmail(otp)
  }
}

/**
 * Sends an authentication OTP email.
 * Uses Resend when configured. In non-production without RESEND_API_KEY,
 * logs the OTP so local development can continue.
 */
export async function sendAuthOtpEmail({
  email,
  otp,
  type,
}: SendAuthOtpEmailInput): Promise<void> {
  const template = getTemplate(type, otp)
  const resend = getResendClient()

  if (!resend) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is required to send authentication emails.")
    }

    console.info("[auth-email:dev]", {
      to: email,
      type,
      subject: template.subject,
      otp,
    })
    return
  }

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })

  if (error) {
    console.error("Failed to send authentication email:", error)
    throw new Error("Failed to send authentication email.")
  }
}
