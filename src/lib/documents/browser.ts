export class DocumentApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status = 500, code?: string) {
    super(message)
    this.name = "DocumentApiError"
    this.status = status
    this.code = code
  }
}

type ApiErrorPayload = {
  error?: {
    code?: unknown
    message?: unknown
  }
}

async function readApiError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as ApiErrorPayload
    const message = data.error?.message
    const code = data.error?.code

    return {
      message:
        typeof message === "string" && message.length > 0 ? message : fallback,
      code: typeof code === "string" ? code : undefined,
    }
  } catch (error) {
    console.error("Failed to read API error response:", error)
    return {
      message: fallback,
      code: undefined,
    }
  }
}

async function parseJson<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    const { message, code } = await readApiError(response, fallback)
    throw new DocumentApiError(message, response.status, code)
  }

  try {
    return (await response.json()) as T
  } catch (error) {
    console.error("Failed to parse API response:", error)
    throw new DocumentApiError(fallback, response.status)
  }
}

export function isDocumentNotFoundError(error: unknown) {
  return (
    error instanceof DocumentApiError &&
    (error.status === 404 || error.code === "DOCUMENT_NOT_FOUND")
  )
}

export function isUnauthorizedDocumentError(error: unknown) {
  return (
    error instanceof DocumentApiError &&
    (error.status === 401 || error.code === "UNAUTHORIZED")
  )
}

export function isValidationDocumentError(error: unknown) {
  return (
    error instanceof DocumentApiError &&
    (error.status === 400 || error.code === "VALIDATION_ERROR")
  )
}

export function isTransientDocumentError(error: unknown) {
  if (!(error instanceof DocumentApiError)) {
    return true
  }

  return (
    error.status >= 500 ||
    error.status === 408 ||
    error.status === 429 ||
    error.status === 503
  )
}

export async function requestUploadUrl(input: {
  name: string
  size: number
  mimeType: string
}) {
  const response = await fetch("/api/documents/upload-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  })

  return parseJson<{
    documentId: string
    version: number
    uploadUrl: string
  }>(response, "Could not start the upload.")
}

export async function requestSaveUrl(documentId: string, size: number) {
  const response = await fetch(`/api/documents/${documentId}/save-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ size }),
  })

  return parseJson<{
    documentId: string
    version: number
    uploadUrl: string
  }>(response, "Could not start saving the PDF.")
}

export async function completeDocumentUpload(input: {
  documentId: string
  size: number
  version: number
}) {
  const response = await fetch(`/api/documents/${input.documentId}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      size: input.size,
      version: input.version,
    }),
    // Saves finalize in the background after the upload; keepalive lets the
    // request finish even if the user navigates away or closes the tab.
    keepalive: true,
  })

  return parseJson<{
    documentId: string
    currentVersion: number
  }>(response, "The PDF uploaded but could not be saved.")
}

export type DocumentVersionSummary = {
  version: number
  size: number
  createdAt: string
}

export async function fetchDocumentVersions(documentId: string) {
  const response = await fetch(`/api/documents/${documentId}/versions`)

  return parseJson<{
    currentVersion: number
    versions: DocumentVersionSummary[]
  }>(response, "Could not load version history.")
}

export async function restoreDocumentVersion(
  documentId: string,
  version: number
) {
  const response = await fetch(`/api/documents/${documentId}/versions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ version }),
  })

  return parseJson<{
    documentId: string
    currentVersion: number
  }>(response, "The version could not be restored.")
}

export async function renameDocument(documentId: string, name: string) {
  const response = await fetch(`/api/documents/${documentId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
    keepalive: true,
  })

  return parseJson<{
    documentId: string
    name: string
  }>(response, "The document could not be renamed.")
}

export async function deleteDocument(documentId: string) {
  const response = await fetch(`/api/documents/${documentId}`, {
    method: "DELETE",
    keepalive: true,
  })

  return parseJson<{
    deleted: boolean
  }>(response, "The document could not be deleted.")
}

export function putPdfToSignedUrl(
  url: string,
  blob: Blob,
  onProgress?: (percent: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.open("PUT", url)
    xhr.setRequestHeader("Content-Type", "application/pdf")

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) {
        return
      }

      onProgress(Math.round((event.loaded / event.total) * 100))
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
        return
      }

      console.error("Signed PDF upload failed:", xhr.status, xhr.responseText)
      reject(new DocumentApiError("The PDF could not be uploaded."))
    }

    xhr.onerror = () => {
      console.error("Signed PDF upload failed: network error")
      reject(new DocumentApiError("The PDF could not be uploaded."))
    }

    xhr.send(blob)
  })
}
