import { NextResponse } from "next/server"

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "DOCUMENT_NOT_FOUND"
  | "VERSION_NOT_FOUND"
  | "UPLOAD_INCOMPLETE"
  | "NOT_PDF"
  | "FILE_TOO_LARGE"
  | "STORAGE_NOT_CONFIGURED"
  | "RATE_LIMITED"
  | "SHARE_NOT_FOUND"
  | "SHARE_EXPIRED"
  | "UNKNOWN"

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode
    message: string
  }
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number
) {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
    },
  }

  return NextResponse.json(body, { status })
}

export function apiSuccess<T extends Record<string, unknown>>(
  data: T,
  status = 200
) {
  return NextResponse.json(data, { status })
}
