import { revalidateTag } from "next/cache"

export const AUTH_STATE_TAG = "auth-state"

export function revalidateAuthState() {
  revalidateTag(AUTH_STATE_TAG, { expire: 0 })
}
