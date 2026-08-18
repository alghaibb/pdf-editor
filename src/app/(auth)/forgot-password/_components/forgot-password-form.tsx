"use client"

import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { forgotPasswordAction } from "@/app/(auth)/forgot-password/_actions/forgot-password"
import { authErrorMessage } from "@/lib/auth/errors"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/schemas/auth/forgot-password"

export function ForgotPasswordForm() {
  const router = useRouter()
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const formError = form.formState.errors.root?.message

  async function onSubmit(values: ForgotPasswordInput) {
    form.clearErrors("root")

    const result = await forgotPasswordAction(values)

    if (!result.success) {
      const message = authErrorMessage(result.error)
      form.setError("root", { message })
      toast.error(message)
      return
    }

    toast.success("If an account exists, a reset code has been sent.")
    router.push(`/reset-password?email=${encodeURIComponent(values.email)}`)
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <FieldGroup>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="forgot-password-email">Email</FieldLabel>
              <Input
                {...field}
                id="forgot-password-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={fieldState.invalid}
                disabled={form.formState.isSubmitting}
              />
              <FieldDescription>
                We&apos;ll send a one-time code if an account exists for this
                email.
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
        loadingText="Sending..."
      >
        Send reset code
      </LoadingButton>
    </form>
  )
}
