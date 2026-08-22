"use client"

import { DownloadIcon, LayoutDashboardIcon, SaveIcon } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { cn } from "@/lib/utils"
import { useEditorStore } from "@/stores/editor-store"
import { DocumentNameEditor } from "./document-name-editor"
import { EditorMoreActions } from "./editor-more-actions"
import { LeaveEditorLink } from "./leave-editor-link"
import { SaveStatus } from "./save-status"
import { VersionHistory } from "./version-history"

type EditorToolbarProps = {
  documentId: string
  onSave: () => Promise<void>
  onDownload: () => Promise<void>
  onRecognizeText: () => Promise<void>
  onInsertPages: (file: File) => Promise<void>
}

export function EditorToolbar({
  documentId,
  onSave,
  onDownload,
  onRecognizeText,
  onInsertPages,
}: EditorToolbarProps) {
  const isReady = useEditorStore((state) => state.isReady)
  const isDirty = useEditorStore((state) => state.isDirty)
  const isSaving = useEditorStore((state) => state.isSaving)
  const isFinalizing = useEditorStore((state) => state.isFinalizing)
  const isDownloading = useEditorStore((state) => state.isDownloading)

  return (
    <header className="min-w-0 shrink-0 overflow-hidden border-b border-border">
      <div className="flex min-w-0 items-center gap-2 px-2 py-2 sm:px-4 lg:gap-4 lg:px-6">
        <LeaveEditorLink
          href="/"
          className="font-heading shrink-0 text-xs font-semibold tracking-[0.14em] uppercase lg:text-sm lg:tracking-[0.2em]"
        >
          PDF Editor
        </LeaveEditorLink>
        <DocumentNameEditor
          documentId={documentId}
          className="hidden lg:flex"
        />
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <SaveStatus
            compact
            className="max-w-18 truncate tracking-[0.12em] lg:max-w-none"
          />
          <LoadingButton
            type="button"
            variant="outline"
            size="icon-sm"
            className="lg:h-10 lg:w-auto lg:gap-1.5 lg:px-6"
            loading={isDownloading}
            loadingText={
              <span className="hidden lg:inline">Downloading...</span>
            }
            disabled={!isReady || isSaving}
            aria-label="Download PDF"
            onClick={() => void onDownload()}
          >
            <DownloadIcon data-icon="inline-start" />
            <span className="hidden lg:inline">Download</span>
          </LoadingButton>
          <LoadingButton
            type="button"
            variant="glow"
            size="icon-sm"
            className="lg:h-10 lg:w-auto lg:gap-1.5 lg:px-6"
            loading={isSaving}
            loadingText={<span className="hidden lg:inline">Saving...</span>}
            disabled={!isReady || isDownloading || isFinalizing || !isDirty}
            aria-label="Save PDF"
            onClick={() => void onSave()}
          >
            <SaveIcon data-icon="inline-start" />
            <span className="hidden lg:inline">Save</span>
          </LoadingButton>
          <EditorMoreActions
            documentId={documentId}
            onRecognizeText={onRecognizeText}
            onInsertPages={onInsertPages}
          />
          <VersionHistory documentId={documentId} />
          <ThemeToggle className="size-9 lg:size-10" />
          <LeaveEditorLink
            href="/dashboard"
            aria-label="Dashboard"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "lg:hidden"
            )}
          >
            <LayoutDashboardIcon />
          </LeaveEditorLink>
          <LeaveEditorLink
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "hidden lg:inline-flex"
            )}
          >
            Home
          </LeaveEditorLink>
          <LeaveEditorLink
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "hidden lg:inline-flex"
            )}
          >
            Dashboard
          </LeaveEditorLink>
        </div>
      </div>
      <div className="min-w-0 border-t border-border px-2 py-1.5 lg:hidden">
        <DocumentNameEditor
          documentId={documentId}
          className="w-full text-xs text-muted-foreground"
        />
      </div>
    </header>
  )
}
