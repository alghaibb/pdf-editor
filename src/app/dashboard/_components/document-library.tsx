"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { DocumentList } from "@/app/dashboard/_components/document-list"
import { UploadDocumentButton } from "@/app/dashboard/_components/upload-document-button"
import {
  DocumentApiError,
  isDocumentNotFoundError,
  isUnauthorizedDocumentError,
} from "@/lib/documents/browser"
import {
  flushOutbox,
  listOutboxOps,
  mergeDocumentsWithOutbox,
  sortDocumentSnapshots,
  upsertOutboxOp,
  type DocumentOutboxOp,
  type DocumentSnapshot,
} from "@/lib/documents/outbox"

type DocumentLibraryProps = {
  userId: string
  documents: DocumentSnapshot[]
  storageReady: boolean
}

function restoreDocuments(
  documents: DocumentSnapshot[],
  op: DocumentOutboxOp
) {
  if (op.type === "delete") {
    const alreadyPresent = documents.some(
      (document) => document.id === op.previous.id
    )

    if (alreadyPresent) {
      return sortDocumentSnapshots(
        documents.map((document) =>
          document.id === op.previous.id ? op.previous : document
        )
      )
    }

    return sortDocumentSnapshots([...documents, op.previous])
  }

  return documents.map((document) =>
    document.id === op.documentId
      ? {
          ...document,
          name: op.previous.name,
        }
      : document
  )
}

export function DocumentLibrary({
  userId,
  documents,
  storageReady,
}: DocumentLibraryProps) {
  const router = useRouter()
  const [items, setItems] = useState(documents)
  const refreshTimerRef = useRef<number | null>(null)
  const syncIdRef = useRef(0)
  const handleOpFailedRef = useRef<(op: DocumentOutboxOp, error: unknown) => void>(
    () => {}
  )

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current)
    }

    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null
      router.refresh()
    }, 400)
  }, [router])

  const handleOpFailed = useCallback(
    (op: DocumentOutboxOp, error: unknown) => {
      if (isUnauthorizedDocumentError(error)) {
        toast.error("You need to sign in again.")
        return
      }

      if (isDocumentNotFoundError(error) && op.type === "rename") {
        setItems((current) =>
          current.filter((document) => document.id !== op.documentId)
        )
        toast.error("That document is no longer available.")
        scheduleRefresh()
        return
      }

      setItems((current) => restoreDocuments(current, op))
      console.error("Document change could not be saved:", error)

      if (error instanceof DocumentApiError) {
        toast.error(error.message)
        return
      }

      toast.error(
        op.type === "delete"
          ? "The document could not be deleted."
          : "The document could not be renamed."
      )
    },
    [scheduleRefresh]
  )

  useEffect(() => {
    handleOpFailedRef.current = handleOpFailed
  }, [handleOpFailed])

  const syncFromOutbox = useCallback(() => {
    const requestId = ++syncIdRef.current

    return listOutboxOps(userId)
      .then((ops) => {
        if (requestId !== syncIdRef.current) {
          return
        }

        setItems(mergeDocumentsWithOutbox(documents, ops))

        return flushOutbox(userId, {
          onOpFailed: (op, error) => handleOpFailedRef.current(op, error),
        })
      })
      .catch((error: unknown) => {
        console.error("Failed to sync document changes:", error)
      })
  }, [documents, userId])

  useEffect(() => {
    void syncFromOutbox()
  }, [syncFromOutbox])

  useEffect(() => {
    function onOnline() {
      void syncFromOutbox()
    }

    function onVisible() {
      if (document.visibilityState === "visible") {
        onOnline()
      }
    }

    window.addEventListener("online", onOnline)
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      window.removeEventListener("online", onOnline)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [syncFromOutbox])

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current)
      }
    }
  }, [])

  const renameDocumentOptimistically = useCallback(
    (documentId: string, name: string) => {
      const current = items.find((item) => item.id === documentId)

      if (!current || current.name === name) {
        return
      }

      syncIdRef.current += 1
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === documentId ? { ...item, name } : item
        )
      )
      toast.success("Document renamed.")

      void upsertOutboxOp({
        userId,
        documentId,
        type: "rename",
        name,
        previous: current,
        retryCount: 0,
        updatedAt: Date.now(),
      })
        .then(() =>
          flushOutbox(userId, {
            onOpFailed: (op, error) => handleOpFailedRef.current(op, error),
          })
        )
        .then(() => scheduleRefresh())
        .catch((error: unknown) => {
          console.error("Failed to queue document rename:", error)
          setItems((currentItems) =>
            currentItems.map((item) =>
              item.id === documentId ? current : item
            )
          )
          toast.error("The document could not be renamed.")
        })
    },
    [items, scheduleRefresh, userId]
  )

  const deleteDocumentOptimistically = useCallback(
    (documentId: string) => {
      const current = items.find((item) => item.id === documentId)

      if (!current) {
        return
      }

      syncIdRef.current += 1
      setItems((currentItems) =>
        currentItems.filter((item) => item.id !== documentId)
      )
      toast.success("Document deleted.")

      void upsertOutboxOp({
        userId,
        documentId,
        type: "delete",
        previous: current,
        retryCount: 0,
        updatedAt: Date.now(),
      })
        .then(() =>
          flushOutbox(userId, {
            onOpFailed: (op, error) => handleOpFailedRef.current(op, error),
          })
        )
        .then(() => scheduleRefresh())
        .catch((error: unknown) => {
          console.error("Failed to queue document delete:", error)
          setItems((currentItems) =>
            restoreDocuments(currentItems, {
              userId,
              documentId,
              type: "delete",
              previous: current,
              retryCount: 0,
              updatedAt: Date.now(),
            })
          )
          toast.error("The document could not be deleted.")
        })
    },
    [items, scheduleRefresh, userId]
  )

  return (
    <div className="flex flex-col gap-14">
      <UploadDocumentButton
        disabled={!storageReady}
        isEmpty={items.length === 0}
      />
      {items.length === 0 ? null : (
        <DocumentList
          documents={items}
          onRename={renameDocumentOptimistically}
          onDelete={deleteDocumentOptimistically}
        />
      )}
    </div>
  )
}
