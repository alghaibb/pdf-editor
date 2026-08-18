"use client"

import { useFormStatus } from "react-dom"

import { LoadingButton } from "@/components/ui/loading-button"

export function SignOutButton() {
  const { pending } = useFormStatus()

  return (
    <LoadingButton
      type="submit"
      variant="outline"
      loading={pending}
      loadingText="Signing out..."
    >
      Sign out
    </LoadingButton>
  )
}
