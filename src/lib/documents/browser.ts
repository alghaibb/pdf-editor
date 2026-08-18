export class DocumentApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DocumentApiError"
  }
}

type ApiErrorPayload = {
  error?: {
    message?: unknown
  }
}

export async function readApiErrorMessage(
  response: Response,
  fallback: string
) {
  try {
    const data = (await response.json()) as ApiErrorPayload
    const message = data.error?.message

    if (typeof message === "string" && message.length > 0) {
      return message
    }

    return fallback
  } catch (error) {
    console.error("Failed to read API error response:", error)
    return fallback
  }
}

async function parseJson<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    throw new DocumentApiError(await readApiErrorMessage(response, fallback))
  }

  try {
    return (await response.json()) as T
  } catch (error) {
    console.error("Failed to parse API response:", error)
    throw new DocumentApiError(fallback)
  }
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
  })

  return parseJson<{
    documentId: string
    currentVersion: number
  }>(response, "The PDF uploaded but could not be saved.")
}

export async function deleteDocument(documentId: string) {
  const response = await fetch(`/api/documents/${documentId}`, {
    method: "DELETE",
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
