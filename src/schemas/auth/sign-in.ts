import { z } from "zod"

import { emailSchema, passwordSchema } from "@/schemas/auth/shared"

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export type SignInInput = z.infer<typeof signInSchema>
