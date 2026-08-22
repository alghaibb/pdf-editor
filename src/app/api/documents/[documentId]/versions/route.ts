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
import {
  documentIdSchema,
  listVersionsQuerySchema,
  restoreVersionSchema,
} from "@/schemas/documents"

const VERSION_PAGE_SIZE = 20

export async function GET(
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

  const parsedQuery = listVersionsQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams)
  )

  if (!parsedQuery.success) {
    return apiError("VALIDATION_ERROR", "Invalid request.", 400)
  }

  try {
    const document = await getOwnedDocument(parsedId.data, session.user.id)

    if (!document) {
      return apiError("DOCUMENT_NOT_FOUND", "Document not found.", 404)
    }

    // One extra row signals another page without a second count query.
    const rows = await listDocumentVersions(document.id, session.user.id, {
      cursor: parsedQuery.data.cursor,
      take: VERSION_PAGE_SIZE + 1,
    })
    const hasMore = rows.length > VERSION_PAGE_SIZE
    const page = hasMore ? rows.slice(0, VERSION_PAGE_SIZE) : rows

    return apiSuccess({
      currentVersion: document.currentVersion,
      versions: page.map((row) => ({
        version: row.version,
        size: row.size,
        createdAt: row.createdAt.toISOString(),
      })),
      nextCursor: hasMore ? page[page.length - 1].version : null,
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
