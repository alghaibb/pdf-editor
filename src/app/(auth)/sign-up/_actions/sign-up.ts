"use server"

import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import {
  type AuthActionResult,
  toAuthActionError,
} from "@/lib/auth/errors"
import { signUpSchema } from "@/schemas/auth/sign-up"

export async function signUpAction(
  input: unknown
): Promise<AuthActionResult> {
  const parsed = signUpSchema.safeParse(input)

  if (!parsed.success) {
    return { success: false, error: "VALIDATION_ERROR" }
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      },
      headers: await headers(),
    })

    return { success: true }
  } catch (error) {
    console.error("Sign-up failed:", error)
    return toAuthActionError(error)
  }
}
