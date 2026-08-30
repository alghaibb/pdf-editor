import { OAuthErrorNotice } from "@/components/auth/oauth-error-notice"
import { SocialSignIn } from "@/components/auth/social-sign-in"

type AuthMethodsProps = {
  googleEnabled: boolean
  error?: string
  children: React.ReactNode
}

export function AuthMethods({
  googleEnabled,
  error,
  children,
}: AuthMethodsProps) {
  return (
    <div className="flex flex-col gap-6">
      <OAuthErrorNotice error={error} />
      {googleEnabled ? <SocialSignIn /> : null}
      {children}
    </div>
  )
}
