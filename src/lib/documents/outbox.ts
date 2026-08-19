import Dexie, { type Table } from "dexie"

import {
  deleteDocument,
  isDocumentNotFoundError,
  isTransientDocumentError,
  isUnauthorizedDocumentError,
  isValidationDocumentError,
  renameDocument,
} from "@/lib/documents/browser"

export type DocumentSnapshot = {
  id: string
  name: string
  updatedAt: string
}

export type DocumentOutboxOp = {
  userId: string
  documentId: string
  type: "rename" | "delete"
  name?: string
  previous: DocumentSnapshot
  retryCount: number
  updatedAt: number
}

const MAX_OUTBOX_RETRIES = 5
const OUTBOX_LOCK = "pdf-editor-document-outbox"

class DocumentOutboxDatabase extends Dexie {
  ops!: Table<DocumentOutboxOp, [string, string]>

  constructor() {
    super("pdf-editor-document-outbox")
    this.version(1).stores({
      ops: "[userId+documentId], userId",
    })
  }
}

let database: DocumentOutboxDatabase | undefined

function getOutboxDb() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available.")
  }

  if (!database) {
    database = new DocumentOutboxDatabase()
  }

  return database
}

export function sortDocumentSnapshots(documents: DocumentSnapshot[]) {
  return [...documents].sort((left, right) => {
    const byDate = right.updatedAt.localeCompare(left.updatedAt)

    if (byDate !== 0) {
      return byDate
    }

    return left.name.localeCompare(right.name)
  })
}

export function mergeDocumentsWithOutbox(
  documents: DocumentSnapshot[],
  ops: DocumentOutboxOp[]
) {
  const opByDocumentId = new Map(ops.map((op) => [op.documentId, op]))

  const merged = documents.flatMap((document) => {
    const op = opByDocumentId.get(document.id)

    if (!op) {
      return [document]
    }

    if (op.type === "delete") {
      return []
    }

    return [
      {
        ...document,
        name: op.name ?? document.name,
      },
    ]
  })

  return sortDocumentSnapshots(merged)
}

export async function listOutboxOps(userId: string) {
  return getOutboxDb().ops.where("userId").equals(userId).toArray()
}

export async function upsertOutboxOp(op: DocumentOutboxOp) {
  const db = getOutboxDb()
  const existing = await db.ops.get([op.userId, op.documentId])

  if (existing?.type === "delete") {
    return
  }

  const previous = existing?.previous ?? op.previous

  await db.ops.put({
    ...op,
    previous,
    retryCount: 0,
    updatedAt: Date.now(),
  })
}

type FlushOutboxHandlers = {
  onOpFailed: (op: DocumentOutboxOp, error: unknown) => void
}

async function executeOutboxOp(op: DocumentOutboxOp) {
  if (op.type === "delete") {
    try {
      await deleteDocument(op.documentId)
    } catch (error) {
      if (isDocumentNotFoundError(error)) {
        return
      }

      throw error
    }

    return
  }

  const name = op.name

  if (!name) {
    throw new Error("Rename is missing a document name.")
  }

  await renameDocument(op.documentId, name)
}

function isSameOutboxOp(
  left: DocumentOutboxOp | undefined,
  right: DocumentOutboxOp
) {
  return (
    left !== undefined &&
    left.type === right.type &&
    left.name === right.name &&
    left.updatedAt === right.updatedAt
  )
}

function shouldFailOutboxOp(op: DocumentOutboxOp, error: unknown) {
  if (isUnauthorizedDocumentError(error)) {
    return false
  }

  if (isValidationDocumentError(error) || isDocumentNotFoundError(error)) {
    return true
  }

  if (!isTransientDocumentError(error)) {
    return true
  }

  return op.retryCount + 1 >= MAX_OUTBOX_RETRIES
}

async function flushOutboxUnlocked(
  userId: string,
  handlers: FlushOutboxHandlers
) {
  const db = getOutboxDb()

  while (true) {
    const ops = await db.ops.where("userId").equals(userId).sortBy("updatedAt")
    const op = ops[0]

    if (!op) {
      return
    }

    const latest = await db.ops.get([op.userId, op.documentId])

    if (!latest) {
      console.error("Document outbox row disappeared before flush:", op)
      return
    }

    try {
      await executeOutboxOp(latest)

      const current = await db.ops.get([latest.userId, latest.documentId])

      if (isSameOutboxOp(current, latest)) {
        await db.ops.delete([latest.userId, latest.documentId])
      }
    } catch (error) {
      console.error("Document outbox flush failed:", error)

      const current = await db.ops.get([latest.userId, latest.documentId])

      if (!isSameOutboxOp(current, latest)) {
        continue
      }

      if (shouldFailOutboxOp(latest, error)) {
        await db.ops.delete([latest.userId, latest.documentId])
        handlers.onOpFailed(latest, error)
        continue
      }

      await db.ops.put({
        ...latest,
        retryCount: latest.retryCount + 1,
        updatedAt: Date.now(),
      })

      if (isUnauthorizedDocumentError(error)) {
        handlers.onOpFailed(latest, error)
      }

      return
    }
  }
}

export async function flushOutbox(
  userId: string,
  handlers: FlushOutboxHandlers
) {
  const run = () => flushOutboxUnlocked(userId, handlers)

  if (typeof navigator === "undefined" || !navigator.locks) {
    await run()
    return
  }

  await navigator.locks.request(OUTBOX_LOCK, run)
}
