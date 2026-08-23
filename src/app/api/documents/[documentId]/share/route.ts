import { randomBytes } from "node:crypto"

import { rateLimitedResponse, isRateLimited } from "@/lib/api/rate-limit"
import { apiError, apiSuccess } from "@/lib/api/response"
import {
  requireApiSession,
  unauthorizedResponse,
} from "@/lib/api/session"
import {
  createDocumentShare,
  getOwnedDocument,
  listOwnedShares,
} from "@/lib/documents/queries"
import { getAppOrigin } from "@/lib/http/origin"
import { createShareSchema, documentIdSchema } from "@/schemas/documents"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const session = await requireApiSession()

  if (!session) {
    return unauthorizedResponse()
  }

  if (isRateLimited(`list-shares:${session.user.id}`, 30, 60_000)) {
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

    const shares = await listOwnedShares(document.id, session.user.id)
    const origin = getAppOrigin(request)

    return apiSuccess({
      shares: shares.map((share) => ({
        id: share.id,
        url: `${origin}/s/${share.token}`,
        version: share.version,
        expiresAt: share.expiresAt.toISOString(),
        createdAt: share.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Failed to list document shares:", error)
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

  if (isRateLimited(`share:${session.user.id}`, 20, 60_000)) {
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
    console.error("Failed to parse share request:", error)
    return apiError("VALIDATION_ERROR", "Invalid request body.", 400)
  }

  const parsedBody = createShareSchema.safeParse(json)

  if (!parsedBody.success) {
    return apiError("VALIDATION_ERROR", "Choose a valid expiry.", 400)
  }

  try {
    const document = await getOwnedDocument(parsedId.data, session.user.id)

    if (!document || document.currentVersion < 1) {
      return apiError("DOCUMENT_NOT_FOUND", "Document not found.", 404)
    }

    const share = await createDocumentShare({
      documentId: document.id,
      token: randomBytes(18).toString("base64url"),
      version: document.currentVersion,
      expiresAt: new Date(
        Date.now() + parsedBody.data.hours * 60 * 60 * 1000
      ),
    })

    return apiSuccess({
      id: share.id,
      url: `${getAppOrigin(request)}/s/${share.token}`,
      version: share.version,
      expiresAt: share.expiresAt.toISOString(),
      hours: parsedBody.data.hours,
    })
  } catch (error) {
    console.error("Failed to create document share:", error)
    return apiError("UNKNOWN", "Something went wrong. Please try again.", 500)
  }
}
