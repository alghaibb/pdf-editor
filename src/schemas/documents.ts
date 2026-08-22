import { z } from "zod"

import {
  MAX_DOCUMENT_NAME_LENGTH,
  MAX_PDF_SIZE_BYTES,
  PDF_MIME_TYPE,
} from "@/lib/pdf/constants"

export const documentIdSchema = z.uuid()

export const createUploadUrlSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(MAX_DOCUMENT_NAME_LENGTH + 4),
  size: z.number().int().positive().max(MAX_PDF_SIZE_BYTES),
  mimeType: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value ||
        value === PDF_MIME_TYPE ||
        value === "application/octet-stream" ||
        value === "",
      "File must be a PDF."
    ),
})

export const signedUploadSizeSchema = z.object({
  size: z.number().int().positive().max(MAX_PDF_SIZE_BYTES),
})

export const completeDocumentSchema = signedUploadSizeSchema.extend({
  version: z.number().int().positive(),
})

export const renameDocumentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(MAX_DOCUMENT_NAME_LENGTH + 4),
})

export const restoreVersionSchema = z.object({
  version: z.number().int().positive(),
})

// Coerced because the version arrives as a dynamic route parameter string.
export const documentVersionParamSchema = z.coerce.number().int().positive()

// Coerced because the cursor arrives as a URL search parameter string.
export const listVersionsQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
})

export type CreateUploadUrlInput = z.infer<typeof createUploadUrlSchema>
export type CompleteDocumentInput = z.infer<typeof completeDocumentSchema>
export type RenameDocumentInput = z.infer<typeof renameDocumentSchema>
