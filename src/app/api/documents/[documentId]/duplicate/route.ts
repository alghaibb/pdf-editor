import { revalidatePath } from "next/cache"

import { rateLimitedResponse, isRateLimited } from "@/lib/api/rate-limit"
import { apiError, apiSuccess } from "@/lib/api/response"
import {
  handleStorageError,
  requireApiSession,
  unauthorizedResponse,
} from "@/lib/api/session"
import { revalidateUserDocuments } from "@/lib/documents/cache-tags"
import { duplicateOwnedDocument } from "@/lib/documents/duplicate"
import { getOwnedDocument } from "@/lib/documents/queries"
import { documentIdSchema } from "@/schemas/documents"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const session = await requireApiSession()

  if (!session) {
    return unauthorizedResponse()
  }

  if (isRateLimited(`duplicate:${session.user.id}`, 15, 60_000)) {
    return rateLimitedResponse()
  }

  const { documentId } = await params
  const parsedId = documentIdSchema.safeParse(documentId)

  if (!parsedId.success) {
    return apiError("DOCUMENT_NOT_FOUND", "Document not found.", 404)
  }

  try {
    const document = await getOwnedDocument(parsedId.data, session.user.id)

    if (!document || document.currentVersion < 1) {
      return apiError("DOCUMENT_NOT_FOUND", "Document not found.", 404)
    }

    const copy = await duplicateOwnedDocument(document)

    revalidateUserDocuments(session.user.id)
    revalidatePath("/dashboard")

    return apiSuccess(
      {
        documentId: copy.id,
        name: copy.name,
        currentVersion: copy.currentVersion,
      },
      201
    )
  } catch (error) {
    const storageResponse = handleStorageError(error)

    if (storageResponse.status !== 500) {
      return storageResponse
    }

    console.error("Failed to duplicate document:", error)
    return apiError("UNKNOWN", "Something went wrong. Please try again.", 500)
  }
}
