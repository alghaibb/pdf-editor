"use client"

import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { signUpAction } from "@/app/(auth)/sign-up/_actions/sign-up"
import { authErrorMessage } from "@/lib/auth/errors"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signUpSchema, type SignUpInput } from "@/schemas/auth/sign-up"

export function SignUpForm() {
  const router = useRouter()
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const formError = form.formState.errors.root?.message

  async function onSubmit(values: SignUpInput) {
    form.clearErrors("root")

    const result = await signUpAction(values)

    if (!result.success) {
      const message = authErrorMessage(result.error)
      form.setError("root", { message })
      toast.error(message)
      return
    }

    toast.success("Account created. Check your email for a verification code.")
    router.push(`/verify-email?email=${encodeURIComponent(values.email)}`)
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <FieldGroup className="gap-5">
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-up-name">Name</FieldLabel>
              <Input
                {...field}
                id="sign-up-name"
                type="text"
                autoComplete="name"
                placeholder="Alex Rivera"
                aria-invalid={fieldState.invalid}
                disabled={form.formState.isSubmitting}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-up-email">Email</FieldLabel>
              <Input
                {...field}
                id="sign-up-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={fieldState.invalid}
                disabled={form.formState.isSubmitting}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-up-password">Password</FieldLabel>
              <PasswordInput
                {...field}
                id="sign-up-password"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
                disabled={form.formState.isSubmitting}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Controller
          name="confirmPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-up-confirm-password">
                Confirm password
              </FieldLabel>
              <PasswordInput
                {...field}
                id="sign-up-confirm-password"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
                disabled={form.formState.isSubmitting}
              />
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
        loadingText="Creating account..."
      >
        Create account
      </LoadingButton>
    </form>
  )
}
