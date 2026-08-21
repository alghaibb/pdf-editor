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
  fetchDocumentVersions,
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
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null)
  const [confirmVersion, setConfirmVersion] = useState<number | null>(null)

  async function loadVersions() {
    setIsLoading(true)

    try {
      const result = await fetchDocumentVersions(documentId)
      setVersions(result.versions)
      setCurrentVersion(result.currentVersion)
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
              Every save keeps a copy. Restoring brings an old version back as
              a new save, so nothing is lost.
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
              versions.map((entry) => {
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
                        {format(new Date(entry.createdAt), "dd/MM/yyyy h:mm a")}{" "}
                        · {formatSize(entry.size)}
                      </p>
                    </div>
                    {isCurrent ? null : (
                      <LoadingButton
                        type="button"
                        variant="outline"
                        size="xs"
                        loading={restoringVersion === entry.version}
                        loadingText="Restoring..."
                        disabled={restoringVersion !== null || isSaving}
                        onClick={() => requestRestore(entry.version)}
                      >
                        Restore
                      </LoadingButton>
                    )}
                  </div>
                )
              })
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
    </>
  )
}
