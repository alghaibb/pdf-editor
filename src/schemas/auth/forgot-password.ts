import { z } from "zod"

import { emailSchema } from "@/schemas/auth/shared"

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
