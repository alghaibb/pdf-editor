import { getSession } from "@/lib/auth/session"
import { apiError } from "@/lib/api/response"
import { R2ConfigError } from "@/lib/r2/env"

export async function requireApiSession() {
  const session = await getSession()

  if (!session) {
    return null
  }

  return session
}

export function unauthorizedResponse() {
  return apiError("UNAUTHORIZED", "You need to sign in.", 401)
}

function isMissingObjectError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false
  }

  const name = "name" in error ? String(error.name) : ""

  if (name === "NotFound" || name === "NoSuchKey") {
    return true
  }

  if (
    "$metadata" in error &&
    typeof error.$metadata === "object" &&
    error.$metadata !== null &&
    "httpStatusCode" in error.$metadata &&
    error.$metadata.httpStatusCode === 404
  ) {
    return true
  }

  return false
}

export function handleStorageError(error: unknown) {
  if (error instanceof R2ConfigError) {
    return apiError(
      "STORAGE_NOT_CONFIGURED",
      "File storage is not configured.",
      503
    )
  }

  if (isMissingObjectError(error)) {
    return apiError(
      "UPLOAD_INCOMPLETE",
      "The PDF was not found in storage. Upload it again.",
      400
    )
  }

  console.error("Storage operation failed:", error)
  return apiError("UNKNOWN", "Something went wrong. Please try again.", 500)
}
