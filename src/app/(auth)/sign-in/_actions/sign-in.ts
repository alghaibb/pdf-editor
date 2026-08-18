"use server"

import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import {
  type AuthActionResult,
  toAuthActionError,
} from "@/lib/auth/errors"
import { signInSchema } from "@/schemas/auth/sign-in"

export async function signInAction(
  input: unknown
): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse(input)

  if (!parsed.success) {
    return { success: false, error: "VALIDATION_ERROR" }
  }

  try {
    await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
      },
      headers: await headers(),
    })

    return { success: true }
  } catch (error) {
    console.error("Sign-in failed:", error)
    return toAuthActionError(error)
  }
}
