"use client"

import { useState } from "react"
import {
  DownloadIcon,
  LayoutDashboardIcon,
  Redo2Icon,
  SaveIcon,
  Undo2Icon,
} from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { cn } from "@/lib/utils"
import { useEditorStore } from "@/stores/editor-store"
import type { CurrentPageInfo } from "../_lib/delete-pages"
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
  onDeleteCurrentPage: () => Promise<void>
  onRotateCurrentPage: () => Promise<void>
  onReadCurrentPage: () => CurrentPageInfo | null
  onUndo: () => Promise<void>
  onRedo: () => Promise<void>
}

export function EditorToolbar({
  documentId,
  onSave,
  onDownload,
  onRecognizeText,
  onInsertPages,
  onDeleteCurrentPage,
  onRotateCurrentPage,
  onReadCurrentPage,
  onUndo,
  onRedo,
}: EditorToolbarProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const isReady = useEditorStore((state) => state.isReady)
  const isDirty = useEditorStore((state) => state.isDirty)
  const isSaving = useEditorStore((state) => state.isSaving)
  const isFinalizing = useEditorStore((state) => state.isFinalizing)
  const isDownloading = useEditorStore((state) => state.isDownloading)
  const canUndo = useEditorStore((state) => state.canUndo)
  const canRedo = useEditorStore((state) => state.canRedo)

  return (
    <header className="min-w-0 shrink-0 border-b border-border">
      <div className="flex min-w-0 items-center gap-2 px-2 py-2 sm:gap-3 sm:px-4 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-4">
          <LeaveEditorLink
            href="/dashboard"
            aria-label="Back to dashboard"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "lg:hidden"
            )}
          >
            <LayoutDashboardIcon />
          </LeaveEditorLink>
          <LeaveEditorLink
            href="/"
            className="font-heading hidden shrink-0 text-sm font-semibold tracking-[0.2em] uppercase lg:inline"
          >
            PDF Editor
          </LeaveEditorLink>
          <DocumentNameEditor
            documentId={documentId}
            className="min-w-0 flex-1 text-sm"
          />
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <SaveStatus compact className="hidden tracking-[0.12em] sm:block" />
          <LoadingButton
            type="button"
            variant="outline"
            size="icon-sm"
            className="hidden sm:inline-flex"
            disabled={!isReady || isSaving || !canUndo}
            aria-label="Undo"
            onClick={() => void onUndo()}
          >
            <Undo2Icon />
          </LoadingButton>
          <LoadingButton
            type="button"
            variant="outline"
            size="icon-sm"
            className="hidden sm:inline-flex"
            disabled={!isReady || isSaving || !canRedo}
            aria-label="Redo"
            onClick={() => void onRedo()}
          >
            <Redo2Icon />
          </LoadingButton>
          <LoadingButton
            type="button"
            variant="outline"
            size="sm"
            className="hidden lg:inline-flex"
            loading={isDownloading}
            loadingText="Downloading..."
            disabled={!isReady || isSaving}
            aria-label="Download PDF"
            onClick={() => void onDownload()}
          >
            <DownloadIcon data-icon="inline-start" />
            Download
          </LoadingButton>
          <LoadingButton
            type="button"
            variant="glow"
            size="icon-sm"
            className="sm:h-9 sm:w-auto sm:px-4"
            loading={isSaving}
            loadingText={<span className="hidden sm:inline">Saving...</span>}
            disabled={!isReady || isDownloading || isFinalizing || !isDirty}
            aria-label="Save PDF"
            onClick={() => void onSave()}
          >
            <SaveIcon data-icon="inline-start" />
            <span className="hidden sm:inline">Save</span>
          </LoadingButton>
          <VersionHistory
            documentId={documentId}
            open={isHistoryOpen}
            onOpenChange={setIsHistoryOpen}
            triggerClassName="hidden md:inline-flex"
          />
          <EditorMoreActions
            documentId={documentId}
            onRecognizeText={onRecognizeText}
            onInsertPages={onInsertPages}
            onDeleteCurrentPage={onDeleteCurrentPage}
            onRotateCurrentPage={onRotateCurrentPage}
            onReadCurrentPage={onReadCurrentPage}
            onUndo={onUndo}
            onRedo={onRedo}
            onDownload={onDownload}
            onOpenHistory={() => {
              window.setTimeout(() => setIsHistoryOpen(true), 0)
            }}
          />
        </div>
      </div>
    </header>
  )
}
