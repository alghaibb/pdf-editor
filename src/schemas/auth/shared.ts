import { z } from "zod"

import {
  AUTH_MAX_PASSWORD_LENGTH,
  AUTH_MIN_PASSWORD_LENGTH,
} from "@/lib/auth/constants"

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."))

export const passwordSchema = z
  .string()
  .min(
    AUTH_MIN_PASSWORD_LENGTH,
    `Password must be at least ${AUTH_MIN_PASSWORD_LENGTH} characters.`
  )
  .max(
    AUTH_MAX_PASSWORD_LENGTH,
    `Password must be at most ${AUTH_MAX_PASSWORD_LENGTH} characters.`
  )
