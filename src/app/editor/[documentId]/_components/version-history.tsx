"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { HistoryIcon } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DocumentApiError,
  deleteDocumentVersion,
  fetchDocumentVersions,
  requestVersionDownloadUrl,
  restoreDocumentVersion,
  type DocumentVersionSummary,
} from "@/lib/documents/browser"
import { useEditorStore } from "@/stores/editor-store"

type VersionHistoryProps = {
  documentId: string
}

function formatSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`
  }

  return `${size} B`
}

export function VersionHistory({ documentId }: VersionHistoryProps) {
  const router = useRouter()
  const isSaving = useEditorStore((state) => state.isSaving)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [versions, setVersions] = useState<DocumentVersionSummary[] | null>(
    null
  )
  const [currentVersion, setCurrentVersion] = useState(0)
  const [nextCursor, setNextCursor] = useState<number | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null)
  const [deletingVersion, setDeletingVersion] = useState<number | null>(null)
  const [downloadingVersion, setDownloadingVersion] = useState<number | null>(
    null
  )
  const [confirmVersion, setConfirmVersion] = useState<number | null>(null)
  const [confirmDeleteVersion, setConfirmDeleteVersion] = useState<
    number | null
  >(null)
  const isBusy =
    restoringVersion !== null ||
    deletingVersion !== null ||
    downloadingVersion !== null ||
    isSaving

  async function loadVersions() {
    setIsLoading(true)

    try {
      const result = await fetchDocumentVersions(documentId)
      setVersions(result.versions)
      setCurrentVersion(result.currentVersion)
      setNextCursor(result.nextCursor)
    } catch (error) {
      console.error("Failed to load version history:", error)
      toast.error(
        error instanceof DocumentApiError
          ? error.message
          : "Could not load version history."
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function loadMore() {
    if (nextCursor === null || isLoadingMore) {
      return
    }

    setIsLoadingMore(true)

    try {
      const result = await fetchDocumentVersions(documentId, nextCursor)
      // Cursor pages are strictly older than what is shown, so appending
      // cannot duplicate entries even if a save happened in between.
      setVersions((previous) => [...(previous ?? []), ...result.versions])
      setNextCursor(result.nextCursor)
    } catch (error) {
      console.error("Failed to load more versions:", error)
      toast.error(
        error instanceof DocumentApiError
          ? error.message
          : "Could not load more versions."
      )
    } finally {
      setIsLoadingMore(false)
    }
  }

  function onOpenChange(open: boolean) {
    setIsOpen(open)

    if (open) {
      void loadVersions()
    }
  }

  function requestRestore(version: number) {
    // Restoring replaces the open document, so dirty edits need an explicit
    // confirmation before they are discarded.
    if (useEditorStore.getState().isDirty) {
      setConfirmVersion(version)
      return
    }

    void restore(version)
  }

  async function restore(version: number) {
    setRestoringVersion(version)

    try {
      await restoreDocumentVersion(documentId, version)
      toast.success(`Version ${version} restored.`)
      setIsOpen(false)
      // The server page presigns a fresh download URL, which remounts the
      // viewer with the restored PDF.
      router.refresh()
    } catch (error) {
      console.error("Failed to restore document version:", error)
      toast.error(
        error instanceof DocumentApiError
          ? error.message
          : "The version could not be restored."
      )
    } finally {
      setRestoringVersion(null)
    }
  }

  async function deleteVersion(version: number) {
    setDeletingVersion(version)

    try {
      await deleteDocumentVersion(documentId, version)
      setVersions((previous) =>
        previous === null
          ? previous
          : previous.filter((entry) => entry.version !== version)
      )
      toast.success(`Version ${version} deleted.`)
    } catch (error) {
      console.error("Failed to delete document version:", error)
      toast.error(
        error instanceof DocumentApiError
          ? error.message
          : "The version could not be deleted."
      )
    } finally {
      setDeletingVersion(null)
    }
  }

  async function downloadVersion(version: number) {
    setDownloadingVersion(version)

    try {
      const result = await requestVersionDownloadUrl(documentId, version)
      window.location.assign(result.downloadUrl)
    } catch (error) {
      console.error("Failed to download document version:", error)
      toast.error(
        error instanceof DocumentApiError
          ? error.message
          : "The version could not be downloaded."
      )
    } finally {
      setDownloadingVersion(null)
    }
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="lg:size-10"
              aria-label="Version history"
            />
          }
        >
          <HistoryIcon />
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Version history</SheetTitle>
            <SheetDescription>
              Every save keeps a copy. Download any version without changing
              the open file. Restoring brings an old version back as a new
              save. Deleting a version is permanent.
            </SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-8 pb-8">
            {isLoading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : versions === null || versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No saved versions yet. Save the document to create one.
              </p>
            ) : (
              <>
                {versions.map((entry) => {
                  const isCurrent = entry.version === currentVersion

                  return (
                    <div
                      key={entry.version}
                      className="flex items-center justify-between gap-4 border border-border px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          Version {entry.version}
                          {isCurrent ? (
                            <span className="ml-2 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                              Current
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {format(
                            new Date(entry.createdAt),
                            "dd/MM/yyyy h:mm a"
                          )}{" "}
                          · {formatSize(entry.size)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <LoadingButton
                          type="button"
                          variant="outline"
                          size="xs"
                          loading={downloadingVersion === entry.version}
                          loadingText="Downloading..."
                          disabled={isBusy}
                          onClick={() => void downloadVersion(entry.version)}
                        >
                          Download
                        </LoadingButton>
                        {isCurrent ? null : (
                          <>
                            <LoadingButton
                              type="button"
                              variant="outline"
                              size="xs"
                              loading={restoringVersion === entry.version}
                              loadingText="Restoring..."
                              disabled={isBusy}
                              onClick={() => requestRestore(entry.version)}
                            >
                              Restore
                            </LoadingButton>
                            <LoadingButton
                              type="button"
                              variant="ghost"
                              size="xs"
                              className="text-muted-foreground hover:text-destructive"
                              loading={deletingVersion === entry.version}
                              loadingText="Deleting..."
                              disabled={isBusy}
                              onClick={() =>
                                setConfirmDeleteVersion(entry.version)
                              }
                            >
                              Delete
                            </LoadingButton>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
                {nextCursor !== null ? (
                  <LoadingButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="self-center"
                    loading={isLoadingMore}
                    loadingText="Loading..."
                    onClick={() => void loadMore()}
                  >
                    Load older versions
                  </LoadingButton>
                ) : null}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <AlertDialog
        open={confirmVersion !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmVersion(null)
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Restoring version {confirmVersion} will replace the document and
              discard your unsaved edits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                const version = confirmVersion
                setConfirmVersion(null)

                if (version !== null) {
                  void restore(version)
                }
              }}
            >
              Restore anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={confirmDeleteVersion !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDeleteVersion(null)
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this version?</AlertDialogTitle>
            <AlertDialogDescription>
              Version {confirmDeleteVersion} will be removed from storage. This
              cannot be undone. The current document is not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                const version = confirmDeleteVersion
                setConfirmDeleteVersion(null)

                if (version !== null) {
                  void deleteVersion(version)
                }
              }}
            >
              Delete version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
