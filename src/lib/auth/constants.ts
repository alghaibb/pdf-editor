/**
 * Auth capability flags derived from the Better Auth configuration in `src/lib/auth.ts`.
 * Keep this in sync when enabling/disabling Better Auth features.
 */
export const AUTH_OTP_LENGTH = 6

export const AUTH_OTP_EXPIRES_IN_SECONDS = 300

export const AUTH_MIN_PASSWORD_LENGTH = 8

export const AUTH_MAX_PASSWORD_LENGTH = 128

export const AUTH_FEATURES = {
  emailPassword: true,
  /** Email OTP plugin is enabled for verification + password reset. */
  emailOtp: true,
  /** Email verification is required before sign-in. */
  emailVerification: true,
  /** Password reset via email OTP is enabled. */
  passwordReset: true,
  /**
   * Passwordless "sign in with code" UI is intentionally not exposed.
   * The emailOTP plugin still supports it server-side.
   */
  signInWithOtp: false,
  socialProviders: [] as const,
} as const

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_VERIFIED"
  | "INVALID_OTP"
  | "TOO_MANY_ATTEMPTS"
  | "USER_EXISTS"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "EMAIL_SEND_FAILED"
  | "UNKNOWN"
