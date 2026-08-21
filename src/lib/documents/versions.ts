import "server-only"

import {
  deleteVersionRecords,
  findPrunableVersions,
  getDocumentVersion,
  markDocumentVersionSaved,
} from "@/lib/documents/queries"
import { versionPdfKey } from "@/lib/r2/keys"
import {
  copyPdfObject,
  deletePdfObjects,
  promoteVersionToCurrent,
} from "@/lib/r2/objects"

/**
 * Every save stores a full copy of the PDF, so retention is bounded to keep
 * storage from growing forever (a 20 MB PDF saved 30 times would otherwise
 * hold 600 MB).
 */
export const MAX_STORED_VERSIONS = 10

/**
 * Deletes stored versions beyond the retention window. R2 objects go first:
 * if that fails the database rows remain, and the next save retries the
 * cleanup. Callers treat failures as non-fatal housekeeping.
 */
export async function pruneStoredVersions(
  documentId: string,
  storageKey: string
) {
  const stale = await findPrunableVersions(documentId, MAX_STORED_VERSIONS)

  if (stale.length === 0) {
    return
  }

  const versions = stale.map((row) => row.version)

  await deletePdfObjects(
    versions.map((version) => versionPdfKey(storageKey, version))
  )
  await deleteVersionRecords(documentId, versions)
}

type RestorableDocument = {
  id: string
  userId: string
  storageKey: string
  currentVersion: number
}

/**
 * Restores an old version non-destructively: the source PDF is copied forward
 * as a brand-new version and promoted to current, so nothing is overwritten
 * and the restore itself appears in history.
 */
export async function restoreDocumentVersion(
  document: RestorableDocument,
  sourceVersion: number
) {
  const source = await getDocumentVersion(document.id, sourceVersion)

  if (!source) {
    return null
  }

  const newVersion = document.currentVersion + 1
  const sourceKey = versionPdfKey(document.storageKey, sourceVersion)
  const newVersionKey = versionPdfKey(document.storageKey, newVersion)

  // Mirror the save flow: objects exist in R2 before the database points at
  // them, so a failure part-way cannot leave the document referencing a
  // missing file.
  await copyPdfObject(sourceKey, newVersionKey)
  await promoteVersionToCurrent(document.storageKey, newVersionKey)

  const saved = await markDocumentVersionSaved({
    documentId: document.id,
    userId: document.userId,
    version: newVersion,
    size: source.size,
  })

  try {
    await pruneStoredVersions(document.id, document.storageKey)
  } catch (error) {
    console.error("Failed to prune old document versions:", error)
  }

  return saved
}
