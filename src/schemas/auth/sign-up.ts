import { z } from "zod"

import { emailSchema, passwordSchema } from "@/schemas/auth/shared"

export const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Enter your name.")
      .max(80, "Name must be at most 80 characters."),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

export type SignUpInput = z.infer<typeof signUpSchema>
