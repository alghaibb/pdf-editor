"use server"

import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import {
  type AuthActionResult,
  toAuthActionError,
} from "@/lib/auth/errors"
import { resetPasswordSchema } from "@/schemas/auth/reset-password"

export async function resetPasswordAction(
  input: unknown
): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse(input)

  if (!parsed.success) {
    return { success: false, error: "VALIDATION_ERROR" }
  }

  try {
    await auth.api.resetPasswordEmailOTP({
      body: {
        email: parsed.data.email,
        otp: parsed.data.otp,
        password: parsed.data.password,
      },
      headers: await headers(),
    })

    return { success: true }
  } catch (error) {
    console.error("Password reset failed:", error)
    return toAuthActionError(error)
  }
}
