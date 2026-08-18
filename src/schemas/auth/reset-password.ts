import { z } from "zod"

import { AUTH_OTP_LENGTH } from "@/lib/auth/constants"
import { emailSchema, passwordSchema } from "@/schemas/auth/shared"

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    otp: z
      .string()
      .regex(new RegExp(`^\\d{${AUTH_OTP_LENGTH}}$`), {
        message: `Enter the ${AUTH_OTP_LENGTH}-digit code.`,
      }),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
