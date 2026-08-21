import { rateLimitedResponse, isRateLimited } from "@/lib/api/rate-limit"
import { apiError, apiSuccess } from "@/lib/api/response"
import {
  handleStorageError,
  requireApiSession,
  unauthorizedResponse,
} from "@/lib/api/session"
import { getOwnedDocument } from "@/lib/documents/queries"
import { versionPdfKey } from "@/lib/r2/keys"
import { createPdfUploadUrl } from "@/lib/r2/objects"
import { documentIdSchema, signedUploadSizeSchema } from "@/schemas/documents"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const session = await requireApiSession()

  if (!session) {
    return unauthorizedResponse()
  }

  if (isRateLimited(`save-url:${session.user.id}`, 30, 60_000)) {
    return rateLimitedResponse()
  }

  const { documentId } = await params
  const parsedId = documentIdSchema.safeParse(documentId)

  if (!parsedId.success) {
    return apiError("DOCUMENT_NOT_FOUND", "Document not found.", 404)
  }

  let json: unknown

  try {
    json = await request.json()
  } catch (error) {
    console.error("Failed to parse save URL request:", error)
    return apiError("VALIDATION_ERROR", "Invalid request body.", 400)
  }

  const parsedBody = signedUploadSizeSchema.safeParse(json)

  if (!parsedBody.success) {
    return apiError(
      "VALIDATION_ERROR",
      "That PDF is too large to save.",
      400
    )
  }

  try {
    const document = await getOwnedDocument(parsedId.data, session.user.id)

    if (!document || document.currentVersion < 1) {
      return apiError("DOCUMENT_NOT_FOUND", "Document not found.", 404)
    }

    const version = document.currentVersion + 1
    const objectKey = versionPdfKey(document.storageKey, version)
    const uploadUrl = await createPdfUploadUrl(objectKey, parsedBody.data.size)

    return apiSuccess({
      documentId: document.id,
      version,
      uploadUrl,
    })
  } catch (error) {
    const storageResponse = handleStorageError(error)

    if (storageResponse.status !== 500) {
      return storageResponse
    }

    console.error("Failed to create PDF save URL:", error)
    return apiError("UNKNOWN", "Something went wrong. Please try again.", 500)
  }
}
