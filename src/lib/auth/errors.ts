import { APIError, isAPIError } from "better-auth/api"

import type { AuthErrorCode } from "@/lib/auth/constants"

export type AuthActionResult =
  | { success: true }
  | { success: false; error: AuthErrorCode; message?: string }

function mapBetterAuthCode(code: string | undefined): AuthErrorCode {
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
    case "INVALID_PASSWORD":
    case "USER_NOT_FOUND":
      return "INVALID_CREDENTIALS"
    case "EMAIL_NOT_VERIFIED":
      return "EMAIL_NOT_VERIFIED"
    case "INVALID_OTP":
    case "OTP_EXPIRED":
    case "INVALID_OTP_CODE":
      return "INVALID_OTP"
    case "TOO_MANY_ATTEMPTS":
      return "TOO_MANY_ATTEMPTS"
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "USER_EXISTS"
    case "TOO_MANY_REQUESTS":
    case "RATE_LIMIT_EXCEEDED":
      return "RATE_LIMITED"
    default:
      return "UNKNOWN"
  }
}

export function toAuthActionError(error: unknown): AuthActionResult {
  if (isAPIError(error) || error instanceof APIError) {
    const apiError = error as APIError
    const code =
      typeof apiError.body === "object" &&
      apiError.body !== null &&
      "code" in apiError.body &&
      typeof apiError.body.code === "string"
        ? apiError.body.code
        : undefined

    const normalizedMessage = apiError.message.toLowerCase()
    const looksUnverified =
      code === "EMAIL_NOT_VERIFIED" ||
      (normalizedMessage.includes("email") &&
        normalizedMessage.includes("verif"))

    if (looksUnverified) {
      return { success: false, error: "EMAIL_NOT_VERIFIED" }
    }

    return {
      success: false,
      error: mapBetterAuthCode(code ?? apiError.message),
    }
  }

  console.error("Unexpected authentication error:", error)
  return { success: false, error: "UNKNOWN" }
}

export function authErrorMessage(code: AuthErrorCode): string {
  switch (code) {
    case "INVALID_CREDENTIALS":
      return "Incorrect email or password."
    case "EMAIL_NOT_VERIFIED":
      return "Please verify your email before signing in."
    case "INVALID_OTP":
      return "That code is invalid or has expired."
    case "TOO_MANY_ATTEMPTS":
      return "Too many attempts. Request a new code and try again."
    case "USER_EXISTS":
      return "Unable to create an account with this email."
    case "VALIDATION_ERROR":
      return "Please check your details and try again."
    case "RATE_LIMITED":
      return "Too many requests. Please wait a moment and try again."
    case "EMAIL_SEND_FAILED":
      return "We couldn't send the email. Please try again."
    case "UNKNOWN":
    default:
      return "Something went wrong. Please try again."
  }
}
