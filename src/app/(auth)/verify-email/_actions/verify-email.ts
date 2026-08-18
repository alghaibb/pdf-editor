"use server"

import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import {
  type AuthActionResult,
  toAuthActionError,
} from "@/lib/auth/errors"
import {
  resendVerificationSchema,
  verifyEmailSchema,
} from "@/schemas/auth/verify-email"

export async function verifyEmailAction(
  input: unknown
): Promise<AuthActionResult> {
  const parsed = verifyEmailSchema.safeParse(input)

  if (!parsed.success) {
    return { success: false, error: "VALIDATION_ERROR" }
  }

  try {
    await auth.api.verifyEmailOTP({
      body: {
        email: parsed.data.email,
        otp: parsed.data.otp,
      },
      headers: await headers(),
    })

    return { success: true }
  } catch (error) {
    console.error("Email verification failed:", error)
    return toAuthActionError(error)
  }
}

export async function resendVerificationAction(
  input: unknown
): Promise<AuthActionResult> {
  const parsed = resendVerificationSchema.safeParse(input)

  if (!parsed.success) {
    return { success: false, error: "VALIDATION_ERROR" }
  }

  try {
    await auth.api.sendVerificationOTP({
      body: {
        email: parsed.data.email,
        type: "email-verification",
      },
      headers: await headers(),
    })

    return { success: true }
  } catch (error) {
    console.error("Resend verification OTP failed:", error)
    return toAuthActionError(error)
  }
}
