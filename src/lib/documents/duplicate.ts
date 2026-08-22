import "server-only"

import {
  createDocumentRecord,
  deleteOwnedDocument,
  markDocumentVersionSaved,
} from "@/lib/documents/queries"
import { duplicateDocumentName } from "@/lib/pdf/name"
import { currentPdfKey, versionPdfKey } from "@/lib/r2/keys"
import { copyPdfObject, deleteDocumentObjects } from "@/lib/r2/objects"

type DuplicatableDocument = {
  id: string
  userId: string
  name: string
  storageKey: string
  size: number
  currentVersion: number
}

/**
 * Copies the current PDF into a brand-new document with its own storage
 * prefix and a fresh version history. The source file is left untouched.
 */
export async function duplicateOwnedDocument(document: DuplicatableDocument) {
  const copy = await createDocumentRecord({
    userId: document.userId,
    name: duplicateDocumentName(document.name),
  })

  try {
    await copyPdfObject(
      currentPdfKey(document.storageKey),
      currentPdfKey(copy.storageKey)
    )
    await copyPdfObject(
      currentPdfKey(document.storageKey),
      versionPdfKey(copy.storageKey, 1)
    )

    return markDocumentVersionSaved({
      documentId: copy.id,
      userId: document.userId,
      version: 1,
      size: document.size,
    })
  } catch (error) {
    console.error("Failed to duplicate document storage:", error)

    try {
      await deleteDocumentObjects(copy.storageKey, document.userId)
    } catch (cleanupError) {
      console.error("Failed to clean up duplicated PDF objects:", cleanupError)
    }

    try {
      await deleteOwnedDocument({
        documentId: copy.id,
        userId: document.userId,
      })
    } catch (cleanupError) {
      console.error("Failed to clean up duplicated document record:", cleanupError)
    }

    throw error
  }
}
