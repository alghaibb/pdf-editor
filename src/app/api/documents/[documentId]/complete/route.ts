import { apiError, apiSuccess } from "@/lib/api/response"
import {
  handleStorageError,
  requireApiSession,
  unauthorizedResponse,
} from "@/lib/api/session"
import { revalidateUserDocuments } from "@/lib/documents/cache-tags"
import {
  getOwnedDocument,
  markDocumentVersionSaved,
} from "@/lib/documents/queries"
import { versionPdfKey } from "@/lib/r2/keys"
import { promoteVersionToCurrent, verifyStoredPdf } from "@/lib/r2/objects"
import { completeDocumentSchema, documentIdSchema } from "@/schemas/documents"

export async function POST(
  request: Request,
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

  let json: unknown

  try {
    json = await request.json()
  } catch (error) {
    console.error("Failed to parse complete-upload request:", error)
    return apiError("VALIDATION_ERROR", "Invalid request body.", 400)
  }

  const parsed = completeDocumentSchema.safeParse(json)

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid request body.", 400)
  }

  try {
    const document = await getOwnedDocument(parsedId.data, session.user.id)

    if (!document) {
      return apiError("DOCUMENT_NOT_FOUND", "Document not found.", 404)
    }

    if (parsed.data.version === document.currentVersion) {
      return apiSuccess({
        documentId: document.id,
        currentVersion: document.currentVersion,
      })
    }

    if (parsed.data.version !== document.currentVersion + 1) {
      return apiError(
        "VALIDATION_ERROR",
        "This save is out of date. Reload the document and try again.",
        409
      )
    }

    const objectKey = versionPdfKey(document.storageKey, parsed.data.version)

    try {
      await verifyStoredPdf(objectKey, parsed.data.size)
    } catch (error) {
      const storageResponse = handleStorageError(error)

      if (storageResponse.status !== 500) {
        return storageResponse
      }

      const message = error instanceof Error ? error.message : ""

      if (message.includes("not a PDF")) {
        return apiError("NOT_PDF", "That file is not a valid PDF.", 400)
      }

      if (message.includes("size does not match")) {
        return apiError(
          "UPLOAD_INCOMPLETE",
          "The uploaded PDF could not be verified. Try again.",
          400
        )
      }

      throw error
    }

    await promoteVersionToCurrent(document.storageKey, objectKey)

    const saved = await markDocumentVersionSaved({
      documentId: document.id,
      userId: session.user.id,
      version: parsed.data.version,
      size: parsed.data.size,
    })

    revalidateUserDocuments(session.user.id)

    return apiSuccess({
      documentId: saved.id,
      currentVersion: saved.currentVersion,
    })
  } catch (error) {
    const storageResponse = handleStorageError(error)

    if (storageResponse.status !== 500) {
      return storageResponse
    }

    console.error("Failed to complete PDF upload:", error)
    return apiError("UNKNOWN", "Something went wrong. Please try again.", 500)
  }
}
