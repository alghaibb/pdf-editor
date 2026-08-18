import { z } from "zod"

import { AUTH_OTP_LENGTH } from "@/lib/auth/constants"
import { emailSchema } from "@/schemas/auth/shared"

export const verifyEmailSchema = z.object({
  email: emailSchema,
  otp: z
    .string()
    .regex(new RegExp(`^\\d{${AUTH_OTP_LENGTH}}$`), {
      message: `Enter the ${AUTH_OTP_LENGTH}-digit code.`,
    }),
})

export const resendVerificationSchema = z.object({
  email: emailSchema,
})

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>
