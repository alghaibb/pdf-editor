import { rateLimitedResponse, isRateLimited } from "@/lib/api/rate-limit"
import { apiError, apiSuccess } from "@/lib/api/response"
import {
  handleStorageError,
  requireApiSession,
  unauthorizedResponse,
} from "@/lib/api/session"
import { getOwnedDocument } from "@/lib/documents/queries"
import { deleteStoredVersion } from "@/lib/documents/versions"
import {
  documentIdSchema,
  documentVersionParamSchema,
} from "@/schemas/documents"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string; version: string }> }
) {
  const session = await requireApiSession()

  if (!session) {
    return unauthorizedResponse()
  }

  if (isRateLimited(`delete-version:${session.user.id}`, 30, 60_000)) {
    return rateLimitedResponse()
  }

  const { documentId, version } = await params
  const parsedId = documentIdSchema.safeParse(documentId)
  const parsedVersion = documentVersionParamSchema.safeParse(version)

  if (!parsedId.success) {
    return apiError("DOCUMENT_NOT_FOUND", "Document not found.", 404)
  }

  if (!parsedVersion.success) {
    return apiError("VALIDATION_ERROR", "Invalid request.", 400)
  }

  try {
    const document = await getOwnedDocument(parsedId.data, session.user.id)

    if (!document || document.currentVersion < 1) {
      return apiError("DOCUMENT_NOT_FOUND", "Document not found.", 404)
    }

    const result = await deleteStoredVersion(document, parsedVersion.data)

    if (result === "current") {
      return apiError(
        "VALIDATION_ERROR",
        "The current version cannot be deleted.",
        409
      )
    }

    if (!result) {
      return apiError(
        "VERSION_NOT_FOUND",
        "That version is no longer available.",
        404
      )
    }

    return apiSuccess({
      deleted: true,
      version: parsedVersion.data,
    })
  } catch (error) {
    const storageResponse = handleStorageError(error)

    if (storageResponse.status !== 500) {
      return storageResponse
    }

    console.error("Failed to delete document version:", error)
    return apiError("UNKNOWN", "Something went wrong. Please try again.", 500)
  }
}
