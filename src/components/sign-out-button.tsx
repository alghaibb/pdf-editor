"use client"

import type { ReactNode } from "react"
import { useFormStatus } from "react-dom"

import { LoadingButton } from "@/components/ui/loading-button"
import { cn } from "@/lib/utils"

type SignOutButtonProps = {
  className?: string
  children?: ReactNode
}

export function SignOutButton({
  className,
  children = "Sign out",
}: SignOutButtonProps) {
  const { pending } = useFormStatus()

  return (
    <LoadingButton
      type="submit"
      variant="outline"
      className={cn(className)}
      loading={pending}
      loadingText="Signing out..."
    >
      {children}
    </LoadingButton>
  )
}
