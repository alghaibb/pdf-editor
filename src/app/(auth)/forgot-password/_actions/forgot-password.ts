"use server"

import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import {
  type AuthActionResult,
  toAuthActionError,
} from "@/lib/auth/errors"
import { forgotPasswordSchema } from "@/schemas/auth/forgot-password"

/**
 * Always returns success for existing/unknown emails to avoid account enumeration.
 * Better Auth still rate-limits the underlying endpoint.
 */
export async function forgotPasswordAction(
  input: unknown
): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input)

  if (!parsed.success) {
    return { success: false, error: "VALIDATION_ERROR" }
  }

  try {
    await auth.api.requestPasswordResetEmailOTP({
      body: {
        email: parsed.data.email,
      },
      headers: await headers(),
    })
  } catch (error) {
    console.error("Forgot password request failed:", error)
    const mapped = toAuthActionError(error)
    if (mapped.success === false && mapped.error === "RATE_LIMITED") {
      return mapped
    }
  }

  return { success: true }
}
