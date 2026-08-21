"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { toast } from "sonner"

import {
  resendVerificationAction,
  verifyEmailAction,
} from "@/app/(auth)/verify-email/_actions/verify-email"
import { AUTH_OTP_LENGTH } from "@/lib/auth/constants"
import { authErrorMessage } from "@/lib/auth/errors"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  verifyEmailSchema,
  type VerifyEmailInput,
} from "@/schemas/auth/verify-email"

type VerifyEmailFormProps = {
  email: string
}

const RESEND_COOLDOWN_SECONDS = 30

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const router = useRouter()
  const [cooldown, setCooldown] = useState(0)
  const [isResending, setIsResending] = useState(false)

  const form = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email,
      otp: "",
    },
  })

  const formError = form.formState.errors.root?.message

  useEffect(() => {
    // The post-verification destination has no visible Link on this page,
    // so warm its static shell manually for an instant redirect.
    router.prefetch("/dashboard")
  }, [router])

  async function onSubmit(values: VerifyEmailInput) {
    form.clearErrors("root")

    const result = await verifyEmailAction(values)

    if (!result.success) {
      const message = authErrorMessage(result.error)
      form.setError("root", { message })
      toast.error(message)
      return
    }

    toast.success("Email verified.")
    router.push("/dashboard")
    router.refresh()
  }

  async function onResend() {
    if (cooldown > 0 || isResending) {
      return
    }

    setIsResending(true)

    try {
      const result = await resendVerificationAction({ email })

      if (!result.success) {
        toast.error(authErrorMessage(result.error))
        return
      }

      toast.success("A new verification code was sent.")
      setCooldown(RESEND_COOLDOWN_SECONDS)

      const intervalId = window.setInterval(() => {
        setCooldown((current) => {
          if (current <= 1) {
            window.clearInterval(intervalId)
            return 0
          }
          return current - 1
        })
      }, 1000)
    } catch (error) {
      console.error("Failed to resend verification code:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <FieldGroup>
        <Controller
          name="otp"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="verify-email-otp">Verification code</FieldLabel>
              <InputOTP
                id="verify-email-otp"
                maxLength={AUTH_OTP_LENGTH}
                pattern={REGEXP_ONLY_DIGITS}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={form.formState.isSubmitting}
                autoComplete="one-time-code"
                aria-invalid={fieldState.invalid}
                containerClassName="justify-between"
              >
                <InputOTPGroup>
                  {Array.from({ length: AUTH_OTP_LENGTH }).map((_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <FieldDescription>
                Sent to {email}. Enter the {AUTH_OTP_LENGTH}-digit code.
              </FieldDescription>
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />
      </FieldGroup>

      <div className="min-h-12">
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}
      </div>

      <LoadingButton
        type="submit"
        variant="glow"
        loading={form.formState.isSubmitting}
        loadingText="Verifying..."
      >
        Verify email
      </LoadingButton>

      <LoadingButton
        type="button"
        variant="ghost"
        loading={isResending}
        loadingText="Sending..."
        disabled={cooldown > 0 || form.formState.isSubmitting}
        onClick={onResend}
      >
        {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
      </LoadingButton>
    </form>
  )
}
