import { apiError, apiSuccess } from "@/lib/api/response"
import {
  handleStorageError,
  requireApiSession,
  unauthorizedResponse,
} from "@/lib/api/session"
import { createDocumentRecord } from "@/lib/documents/queries"
import { versionPdfKey } from "@/lib/r2/keys"
import { createPdfUploadUrl } from "@/lib/r2/objects"
import { createUploadUrlSchema } from "@/schemas/documents"

export async function POST(request: Request) {
  const session = await requireApiSession()

  if (!session) {
    return unauthorizedResponse()
  }

  let json: unknown

  try {
    json = await request.json()
  } catch (error) {
    console.error("Failed to parse upload URL request:", error)
    return apiError("VALIDATION_ERROR", "Invalid request body.", 400)
  }

  const parsed = createUploadUrlSchema.safeParse(json)

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "Choose a PDF that is 50 MB or smaller.",
      400
    )
  }

  try {
    const document = await createDocumentRecord({
      userId: session.user.id,
      name: parsed.data.name,
    })

    const version = 1
    const objectKey = versionPdfKey(document.storageKey, version)
    const uploadUrl = await createPdfUploadUrl(objectKey, parsed.data.size)

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

    console.error("Failed to create PDF upload URL:", error)
    return apiError("UNKNOWN", "Something went wrong. Please try again.", 500)
  }
}
