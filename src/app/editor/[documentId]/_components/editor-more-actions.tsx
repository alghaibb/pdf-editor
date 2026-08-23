"use client"

import { useRef, useState } from "react"
import { MoreHorizontalIcon } from "lucide-react"
import { toast } from "sonner"

import { ShareDocumentDialog } from "@/components/share-document-dialog"
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
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useEditorStore } from "@/stores/editor-store"
import type { CurrentPageInfo } from "../_lib/delete-pages"

type EditorMoreActionsProps = {
  documentId: string
  onRecognizeText: () => Promise<void>
  onInsertPages: (file: File) => Promise<void>
  onDeleteCurrentPage: () => Promise<void>
  onReadCurrentPage: () => CurrentPageInfo | null
}

export function EditorMoreActions({
  documentId,
  onRecognizeText,
  onInsertPages,
  onDeleteCurrentPage,
  onReadCurrentPage,
}: EditorMoreActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [confirmPage, setConfirmPage] = useState<CurrentPageInfo | null>(null)
  const isReady = useEditorStore((state) => state.isReady)
  const isSaving = useEditorStore((state) => state.isSaving)
  const isFinalizing = useEditorStore((state) => state.isFinalizing)
  const isDownloading = useEditorStore((state) => state.isDownloading)
  const isBusy = !isReady || isSaving || isFinalizing || isDownloading

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "outline", size: "icon-sm" }),
            "lg:size-10"
          )}
          disabled={isBusy}
          aria-label="More editor actions"
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          <DropdownMenuItem
            disabled={isBusy}
            onClick={() => void onRecognizeText()}
          >
            Make text editable
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            Insert pages from PDF
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isBusy}
            variant="destructive"
            onClick={() => {
              const page = onReadCurrentPage()

              if (!page) {
                toast.error("The editor is still loading.")
                return
              }

              if (page.pageCount <= 1) {
                toast.error("The last page cannot be deleted.")
                return
              }

              setConfirmPage(page)
            }}
          >
            Delete this page
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isBusy}
            onClick={() => setIsShareOpen(true)}
          >
            Send download link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""

          if (file) {
            void onInsertPages(file)
          }
        }}
      />
      <ShareDocumentDialog
        documentId={documentId}
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
      />
      <AlertDialog
        open={confirmPage !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmPage(null)
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this page?</AlertDialogTitle>
            <AlertDialogDescription>
              Page {confirmPage?.page} of {confirmPage?.pageCount} will be
              removed. Save to keep the change, or restore a version if you
              change your mind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmPage(null)
                void onDeleteCurrentPage()
              }}
            >
              Delete page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
