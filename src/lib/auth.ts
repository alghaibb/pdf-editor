import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { emailOTP } from "better-auth/plugins"

import {
  AUTH_MAX_PASSWORD_LENGTH,
  AUTH_MIN_PASSWORD_LENGTH,
  AUTH_OTP_EXPIRES_IN_SECONDS,
  AUTH_OTP_LENGTH,
} from "@/lib/auth/constants"
import { sendAuthOtpEmail } from "@/lib/email/send"
import prisma from "@/lib/prisma"

function getTrustedOrigins(): string[] {
  const origins = new Set<string>()

  if (process.env.BETTER_AUTH_URL) {
    origins.add(process.env.BETTER_AUTH_URL)
  }

  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`)
  }

  return [...origins]
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: getTrustedOrigins(),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: AUTH_MIN_PASSWORD_LENGTH,
    maxPasswordLength: AUTH_MAX_PASSWORD_LENGTH,
    revokeSessionsOnPasswordReset: true,
  },
  emailVerification: {
    autoSignInAfterVerification: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  rateLimit: {
    enabled: true,
  },
  plugins: [
    emailOTP({
      otpLength: AUTH_OTP_LENGTH,
      expiresIn: AUTH_OTP_EXPIRES_IN_SECONDS,
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      allowedAttempts: 5,
      // Requesting a code while one is still active re-sends that same code
      // instead of rotating it, so an older email in the inbox never carries
      // a code that a newer email has silently invalidated.
      resendStrategy: "reuse",
      async sendVerificationOTP({ email, otp, type }) {
        // Awaited on purpose: Better Auth awaits this callback before it
        // responds (and logs failures itself). Fire-and-forget meant Vercel
        // froze the function with the Resend call still in flight, so codes
        // arrived late — after a resend had rotated them — or not at all.
        await sendAuthOtpEmail({ email, otp, type })
      },
    }),
    // Must remain last so Set-Cookie headers work from Server Actions.
    nextCookies(),
  ],
})
