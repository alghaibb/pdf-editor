import { revalidatePath } from "next/cache"

import { rateLimitedResponse, isRateLimited } from "@/lib/api/rate-limit"
import { apiError, apiSuccess } from "@/lib/api/response"
import {
  handleStorageError,
  requireApiSession,
  unauthorizedResponse,
} from "@/lib/api/session"
import { revalidateUserDocuments } from "@/lib/documents/cache-tags"
import {
  deleteOwnedDocument,
  getOwnedDocument,
  renameOwnedDocument,
} from "@/lib/documents/queries"
import { deleteDocumentObjects } from "@/lib/r2/objects"
import { documentIdSchema, renameDocumentSchema } from "@/schemas/documents"

function revalidateDocumentCaches(userId: string, documentId: string) {
  revalidateUserDocuments(userId)
  revalidatePath("/dashboard")
  revalidatePath(`/editor/${documentId}`)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const session = await requireApiSession()

  if (!session) {
    return unauthorizedResponse()
  }

  if (isRateLimited(`rename:${session.user.id}`, 30, 60_000)) {
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
    console.error("Failed to parse rename request:", error)
    return apiError("VALIDATION_ERROR", "Invalid request body.", 400)
  }

  const parsedBody = renameDocumentSchema.safeParse(json)

  if (!parsedBody.success) {
    return apiError("VALIDATION_ERROR", "Enter a valid document name.", 400)
  }

  try {
    const document = await renameOwnedDocument({
      documentId: parsedId.data,
      userId: session.user.id,
      name: parsedBody.data.name,
    })

    if (!document) {
      return apiError("DOCUMENT_NOT_FOUND", "Document not found.", 404)
    }

    revalidateDocumentCaches(session.user.id, document.id)

    return apiSuccess({
      documentId: document.id,
      name: document.name,
    })
  } catch (error) {
    console.error("Failed to rename document:", error)
    return apiError("UNKNOWN", "Something went wrong. Please try again.", 500)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const session = await requireApiSession()

  if (!session) {
    return unauthorizedResponse()
  }

  if (isRateLimited(`delete:${session.user.id}`, 30, 60_000)) {
    return rateLimitedResponse()
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

    // Remove the database record first so a refresh cannot resurrect the file
    // while R2 cleanup is still running.
    await deleteOwnedDocument({
      documentId: document.id,
      userId: session.user.id,
    })

    revalidateDocumentCaches(session.user.id, document.id)

    try {
      await deleteDocumentObjects(document.storageKey, session.user.id)
    } catch (error) {
      const storageResponse = handleStorageError(error)

      if (storageResponse.status !== 500) {
        console.error(
          "Document record deleted but stored PDF cleanup returned a storage error:",
          error
        )
      } else {
        console.error(
          "Failed to delete stored PDF files after removing the document record:",
          error
        )
      }
    }

    return apiSuccess({
      deleted: true,
    })
  } catch (error) {
    console.error("Failed to delete document:", error)
    return apiError("UNKNOWN", "Something went wrong. Please try again.", 500)
  }
}
