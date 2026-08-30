"use client"

import { useState } from "react"
import { toast } from "sonner"

import { GoogleMark } from "@/components/auth/google-mark"
import { LoadingButton } from "@/components/ui/loading-button"
import { Separator } from "@/components/ui/separator"
import { signIn } from "@/lib/auth-client"
import { authErrorMessage } from "@/lib/auth/errors"

export function SocialSignIn() {
  const [isRedirecting, setIsRedirecting] = useState(false)

  async function continueWithGoogle() {
    setIsRedirecting(true)

    try {
      const { error } = await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
        errorCallbackURL: "/sign-in",
        newUserCallbackURL: "/dashboard",
      })

      if (error) {
        console.error("Google sign-in failed:", error)
        toast.error(authErrorMessage("SOCIAL_AUTH_FAILED"))
        setIsRedirecting(false)
      }
    } catch (error) {
      console.error("Google sign-in failed:", error)
      toast.error(authErrorMessage("SOCIAL_AUTH_FAILED"))
      setIsRedirecting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <LoadingButton
        type="button"
        variant="outline"
        className="h-10 w-full gap-2.5 font-medium tracking-normal normal-case"
        loading={isRedirecting}
        loadingText="Redirecting to Google..."
        onClick={() => void continueWithGoogle()}
      >
        <GoogleMark className="size-4" />
        Continue with Google
      </LoadingButton>
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          or email
        </p>
        <Separator className="flex-1" />
      </div>
    </div>
  )
}
