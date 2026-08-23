"use client"

import { useRef, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
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
  onRotateCurrentPage: () => Promise<void>
  onReadCurrentPage: () => CurrentPageInfo | null
  onUndo: () => Promise<void>
  onRedo: () => Promise<void>
  onDownload: () => Promise<void>
  onOpenHistory: () => void
}

const THEMES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
] as const

function subscribe() {
  return () => {}
}

function useHasMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false)
}

export function EditorMoreActions({
  documentId,
  onRecognizeText,
  onInsertPages,
  onDeleteCurrentPage,
  onRotateCurrentPage,
  onReadCurrentPage,
  onUndo,
  onRedo,
  onDownload,
  onOpenHistory,
}: EditorMoreActionsProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const mounted = useHasMounted()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [confirmPage, setConfirmPage] = useState<CurrentPageInfo | null>(null)
  const [leaveHref, setLeaveHref] = useState<string | null>(null)
  const isReady = useEditorStore((state) => state.isReady)
  const isSaving = useEditorStore((state) => state.isSaving)
  const isFinalizing = useEditorStore((state) => state.isFinalizing)
  const isDownloading = useEditorStore((state) => state.isDownloading)
  const canUndo = useEditorStore((state) => state.canUndo)
  const canRedo = useEditorStore((state) => state.canRedo)
  const isBusy = !isReady || isSaving || isFinalizing || isDownloading

  function requestLeave(href: string) {
    const { isDirty, isFinalizing: isLeavingWhileFinalizing } =
      useEditorStore.getState()

    if (!isDirty && !isLeavingWhileFinalizing) {
      router.push(href)
      return
    }

    setLeaveHref(href)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "outline", size: "icon-sm" })
          )}
          aria-label="More editor actions"
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          <DropdownMenuGroup className="sm:hidden">
            <DropdownMenuLabel>Edit</DropdownMenuLabel>
            <DropdownMenuItem
              disabled={!isReady || isSaving || !canUndo}
              onClick={() => void onUndo()}
            >
              Undo
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!isReady || isSaving || !canRedo}
              onClick={() => void onRedo()}
            >
              Redo
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="sm:hidden" />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Document</DropdownMenuLabel>
            <DropdownMenuItem
              className="lg:hidden"
              disabled={!isReady || isSaving}
              onClick={() => void onDownload()}
            >
              Download
            </DropdownMenuItem>
            <DropdownMenuItem className="md:hidden" onClick={onOpenHistory}>
              Version history
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isBusy}
              onClick={() => setIsShareOpen(true)}
            >
              Send download link
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Pages</DropdownMenuLabel>
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
              className="md:hidden"
              disabled={isBusy}
              onClick={() => void onRotateCurrentPage()}
            >
              Rotate this page
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
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={mounted ? (theme ?? "system") : "system"}
            onValueChange={(value) => {
              if (value === "light" || value === "dark" || value === "system") {
                setTheme(value)
              }
            }}
          >
            <DropdownMenuLabel>Appearance</DropdownMenuLabel>
            {THEMES.map((option) => (
              <DropdownMenuRadioItem key={option.id} value={option.id}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => requestLeave("/dashboard")}>
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => requestLeave("/")}>
              Home
            </DropdownMenuItem>
          </DropdownMenuGroup>
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
      <AlertDialog
        open={leaveHref !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLeaveHref(null)
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>
              This document has changes that are not fully saved yet. They
              will be lost if you leave now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                const href = leaveHref
                setLeaveHref(null)

                if (href) {
                  router.push(href)
                }
              }}
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
