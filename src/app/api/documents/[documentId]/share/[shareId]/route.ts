import { rateLimitedResponse, isRateLimited } from "@/lib/api/rate-limit"
import { apiError, apiSuccess } from "@/lib/api/response"
import {
  requireApiSession,
  unauthorizedResponse,
} from "@/lib/api/session"
import { getOwnedDocument, revokeOwnedShare } from "@/lib/documents/queries"
import { documentIdSchema, shareIdSchema } from "@/schemas/documents"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string; shareId: string }> }
) {
  const session = await requireApiSession()

  if (!session) {
    return unauthorizedResponse()
  }

  if (isRateLimited(`revoke-share:${session.user.id}`, 30, 60_000)) {
    return rateLimitedResponse()
  }

  const { documentId, shareId } = await params
  const parsedId = documentIdSchema.safeParse(documentId)
  const parsedShareId = shareIdSchema.safeParse(shareId)

  if (!parsedId.success || !parsedShareId.success) {
    return apiError("SHARE_NOT_FOUND", "That download link is not valid.", 404)
  }

  try {
    const document = await getOwnedDocument(parsedId.data, session.user.id)

    if (!document) {
      return apiError("DOCUMENT_NOT_FOUND", "Document not found.", 404)
    }

    const revoked = await revokeOwnedShare({
      shareId: parsedShareId.data,
      documentId: document.id,
      userId: session.user.id,
    })

    if (!revoked) {
      return apiError("SHARE_NOT_FOUND", "That download link is not valid.", 404)
    }

    return apiSuccess({
      revoked: true,
      shareId: parsedShareId.data,
    })
  } catch (error) {
    console.error("Failed to revoke document share:", error)
    return apiError("UNKNOWN", "Something went wrong. Please try again.", 500)
  }
}
