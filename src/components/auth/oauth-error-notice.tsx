import { Alert, AlertDescription } from "@/components/ui/alert"
import { oauthErrorMessage } from "@/lib/auth/errors"

export function OAuthErrorNotice({ error }: { error?: string }) {
  if (!error) {
    return null
  }

  return (
    <Alert variant="destructive">
      <AlertDescription>{oauthErrorMessage(error)}</AlertDescription>
    </Alert>
  )
}
