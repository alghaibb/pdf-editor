"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { signInAction } from "@/app/(auth)/sign-in/_actions/sign-in"
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
import { signInSchema, type SignInInput } from "@/schemas/auth/sign-in"

export function SignInForm() {
  const router = useRouter()
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const formError = form.formState.errors.root?.message

  async function onSubmit(values: SignInInput) {
    form.clearErrors("root")

    const result = await signInAction(values)

    if (!result.success) {
      if (result.error === "EMAIL_NOT_VERIFIED") {
        toast.message("Verify your email to continue.")
        router.push(`/verify-email?email=${encodeURIComponent(values.email)}`)
        return
      }

      const message = authErrorMessage(result.error)
      form.setError("root", { message })
      toast.error(message)
      return
    }

    toast.success("Signed in successfully.")
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <FieldGroup className="gap-5">
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
              <Input
                {...field}
                id="sign-in-email"
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
              <div className="flex items-center justify-between gap-3">
                <FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                {...field}
                id="sign-in-password"
                autoComplete="current-password"
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
        loadingText="Signing in..."
      >
        Sign in
      </LoadingButton>
    </form>
  )
}
