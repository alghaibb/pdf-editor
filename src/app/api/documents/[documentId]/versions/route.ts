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
  getOwnedDocument,
  listDocumentVersions,
} from "@/lib/documents/queries"
import { restoreDocumentVersion } from "@/lib/documents/versions"
import { documentIdSchema, restoreVersionSchema } from "@/schemas/documents"

export async function GET(
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

    const versions = await listDocumentVersions(document.id, session.user.id)

    return apiSuccess({
      currentVersion: document.currentVersion,
      versions: versions.map((row) => ({
        version: row.version,
        size: row.size,
        createdAt: row.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Failed to list document versions:", error)
    return apiError("UNKNOWN", "Something went wrong. Please try again.", 500)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const session = await requireApiSession()

  if (!session) {
    return unauthorizedResponse()
  }

  if (isRateLimited(`restore:${session.user.id}`, 10, 60_000)) {
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
    console.error("Failed to parse restore request:", error)
    return apiError("VALIDATION_ERROR", "Invalid request body.", 400)
  }

  const parsed = restoreVersionSchema.safeParse(json)

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid request body.", 400)
  }

  try {
    const document = await getOwnedDocument(parsedId.data, session.user.id)

    if (!document || document.currentVersion < 1) {
      return apiError("DOCUMENT_NOT_FOUND", "Document not found.", 404)
    }

    if (parsed.data.version === document.currentVersion) {
      return apiError(
        "VALIDATION_ERROR",
        "That version is already current.",
        409
      )
    }

    const restored = await restoreDocumentVersion(document, parsed.data.version)

    if (!restored) {
      return apiError(
        "VERSION_NOT_FOUND",
        "That version is no longer available.",
        404
      )
    }

    revalidateUserDocuments(session.user.id)
    revalidatePath("/dashboard")
    revalidatePath(`/editor/${document.id}`)

    return apiSuccess({
      documentId: restored.id,
      currentVersion: restored.currentVersion,
    })
  } catch (error) {
    const storageResponse = handleStorageError(error)

    if (storageResponse.status !== 500) {
      return storageResponse
    }

    console.error("Failed to restore document version:", error)
    return apiError("UNKNOWN", "Something went wrong. Please try again.", 500)
  }
}
