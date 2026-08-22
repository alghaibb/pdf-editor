import { NextResponse } from "next/server"

import { rateLimitedResponse, isRateLimited } from "@/lib/api/rate-limit"
import { apiError } from "@/lib/api/response"
import { handleStorageError } from "@/lib/api/session"
import { getShareByToken } from "@/lib/documents/queries"
import { createCurrentPdfDownloadUrl } from "@/lib/r2/objects"
import { shareTokenSchema } from "@/schemas/documents"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const clientKey = forwardedFor?.split(",")[0]?.trim() || "unknown"

  if (isRateLimited(`share-download:${clientKey}`, 60, 60_000)) {
    return rateLimitedResponse()
  }

  const { token } = await params
  const parsedToken = shareTokenSchema.safeParse(token)

  if (!parsedToken.success) {
    return apiError("SHARE_NOT_FOUND", "That download link is not valid.", 404)
  }

  try {
    const share = await getShareByToken(parsedToken.data)

    if (!share || share.document.currentVersion < 1) {
      return apiError("SHARE_NOT_FOUND", "That download link is not valid.", 404)
    }

    if (share.expiresAt.getTime() <= Date.now()) {
      return apiError("SHARE_EXPIRED", "That download link has expired.", 410)
    }

    const downloadUrl = await createCurrentPdfDownloadUrl(
      share.document.storageKey,
      share.document.name,
      { disposition: "attachment" }
    )

    return NextResponse.redirect(downloadUrl)
  } catch (error) {
    const storageResponse = handleStorageError(error)

    if (storageResponse.status !== 500) {
      return storageResponse
    }

    console.error("Failed to open shared PDF:", error)
    return apiError("UNKNOWN", "Something went wrong. Please try again.", 500)
  }
}
