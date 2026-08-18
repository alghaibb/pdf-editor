import { apiError, apiSuccess } from "@/lib/api/response"
import {
  handleStorageError,
  requireApiSession,
  unauthorizedResponse,
} from "@/lib/api/session"
import {
  deleteOwnedDocument,
  getOwnedDocument,
} from "@/lib/documents/queries"
import { deleteDocumentObjects } from "@/lib/r2/objects"
import { documentIdSchema } from "@/schemas/documents"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const session = await requireApiSession()

  if (!session) {
    return unauthorizedResponse()
  }

  const { documentId } = await params
  const parsedId = documentIdSchema.safeParse(documentId)

  if (!parsedId.success) {
    return apiError("DOCUMENT_NOT_FOUND", "Document not found.", 404)
  }

  try {
    const document = await getOwnedDocument(parsedId.data, session.user.id)

    if (!document) {
      return apiError("DOCUMENT_NOT_FOUND", "Document not found.", 404)
    }

    await deleteDocumentObjects(document.storageKey, session.user.id)
    await deleteOwnedDocument({
      documentId: document.id,
      userId: session.user.id,
    })

    return apiSuccess({
      deleted: true,
    })
  } catch (error) {
    const storageResponse = handleStorageError(error)

    if (storageResponse.status !== 500) {
      return storageResponse
    }

    console.error("Failed to delete document:", error)
    return apiError("UNKNOWN", "Something went wrong. Please try again.", 500)
  }
}
