"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { resetPasswordAction } from "@/app/(auth)/reset-password/_actions/reset-password";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { LoadingButton } from "@/components/ui/loading-button";
import { PasswordInput } from "@/components/ui/password-input";
import { AUTH_OTP_LENGTH } from "@/lib/auth/constants";
import { authErrorMessage } from "@/lib/auth/errors";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/schemas/auth/reset-password";

type ResetPasswordFormProps = {
  email: string;
};

export function ResetPasswordForm({ email }: ResetPasswordFormProps) {
  const router = useRouter();
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email,
      otp: "",
      password: "",
      confirmPassword: "",
    },
  });

  const formError = form.formState.errors.root?.message;

  async function onSubmit(values: ResetPasswordInput) {
    form.clearErrors("root");

    const result = await resetPasswordAction(values);

    if (!result.success) {
      const message = authErrorMessage(result.error);
      form.setError("root", { message });
      toast.error(message);
      return;
    }

    toast.success("Password updated. You can sign in now.");
    router.push("/sign-in");
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
              <FieldLabel htmlFor="reset-password-email">Email</FieldLabel>
              <Input
                {...field}
                id="reset-password-email"
                type="email"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
                disabled
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Controller
          name="otp"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="reset-password-otp">Reset code</FieldLabel>
              <InputOTP
                id="reset-password-otp"
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
                Enter the {AUTH_OTP_LENGTH}-digit code from your email.
              </FieldDescription>
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
              <FieldLabel htmlFor="reset-password-password">
                New password
              </FieldLabel>
              <PasswordInput
                {...field}
                id="reset-password-password"
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
              <FieldLabel htmlFor="reset-password-confirm">
                Confirm new password
              </FieldLabel>
              <PasswordInput
                {...field}
                id="reset-password-confirm"
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
        loadingText="Updating..."
      >
        Update password
      </LoadingButton>
    </form>
  );
}
