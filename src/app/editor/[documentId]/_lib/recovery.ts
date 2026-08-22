import Dexie, { type Table } from "dexie"

export type RecoveryStash = {
  documentId: string
  fileName: string
  blob: Blob
  /**
   * The version the failed save was trying to write. When the server
   * already has this version or newer (for example a save from another
   * tab landed), the stash is stale and gets discarded.
   */
  targetVersion?: number
  updatedAt: number
}

const RECOVERY_TTL_MS = 7 * 24 * 60 * 60 * 1000

class EditorRecoveryDatabase extends Dexie {
  stashes!: Table<RecoveryStash, string>

  constructor() {
    super("pdf-editor-recovery")
    // Blobs are stored on the record but never indexed; lookups only go
    // through the documentId primary key.
    this.version(1).stores({
      stashes: "documentId",
    })
  }
}

let database: EditorRecoveryDatabase | undefined

function getRecoveryDb() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available.")
  }

  if (!database) {
    database = new EditorRecoveryDatabase()
  }

  return database
}

export async function stashRecoveryPdf(
  stash: Omit<RecoveryStash, "updatedAt">
) {
  await getRecoveryDb().stashes.put({ ...stash, updatedAt: Date.now() })
}

export async function getRecoveryStash(documentId: string) {
  const db = getRecoveryDb()
  const stash = await db.stashes.get(documentId)

  if (!stash) {
    return undefined
  }

  if (Date.now() - stash.updatedAt > RECOVERY_TTL_MS) {
    await db.stashes.delete(documentId)
    return undefined
  }

  return stash
}

export async function clearRecoveryStash(documentId: string) {
  await getRecoveryDb().stashes.delete(documentId)
}
