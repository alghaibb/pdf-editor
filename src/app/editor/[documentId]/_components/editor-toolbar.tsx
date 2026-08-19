"use client"

import { useState } from "react"
import Link from "next/link"
import { DownloadIcon, LayoutDashboardIcon, SaveIcon } from "lucide-react"
import { toast } from "sonner"

import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { cn } from "@/lib/utils"
import { useEditorStore } from "@/stores/editor-store"
import { SaveStatus } from "./save-status"

type EditorToolbarProps = {
  onSave: () => Promise<void>
  onDownload: () => Promise<void>
}

export function EditorToolbar({ onSave, onDownload }: EditorToolbarProps) {
  const fileName = useEditorStore((state) => state.fileName)
  const isReady = useEditorStore((state) => state.isReady)
  const isDirty = useEditorStore((state) => state.isDirty)
  const isSaving = useEditorStore((state) => state.isSaving)
  const [isDownloading, setIsDownloading] = useState(false)

  async function handleSave() {
    try {
      await onSave()
      toast.success("PDF saved.")
    } catch (error) {
      console.error("Failed to save PDF:", error)
      toast.error("Could not save the PDF.")
    }
  }

  async function handleDownload() {
    setIsDownloading(true)

    try {
      await onDownload()
      toast.success("PDF downloaded.")
    } catch (error) {
      console.error("Failed to download PDF:", error)
      toast.error("Could not download the PDF.")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <header className="min-w-0 shrink-0 overflow-hidden border-b border-border">
      <div className="flex min-w-0 items-center gap-2 px-2 py-2 sm:px-4 lg:gap-4 lg:px-6">
        <Link
          href="/"
          className="font-heading shrink-0 text-xs font-semibold tracking-[0.14em] uppercase lg:text-sm lg:tracking-[0.2em]"
        >
          PDF Editor
        </Link>
        <p className="hidden min-w-0 truncate text-sm font-medium lg:block">
          {fileName}
        </p>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <SaveStatus
            compact
            className="max-w-18 truncate tracking-[0.12em] lg:max-w-none"
          />
          <LoadingButton
            type="button"
            variant="outline"
            size="icon-sm"
            className="lg:h-10 lg:w-auto lg:px-6"
            loading={isDownloading}
            loadingText={
              <span className="hidden lg:inline">Downloading...</span>
            }
            disabled={!isReady || isSaving}
            aria-label="Download PDF"
            onClick={handleDownload}
          >
            <DownloadIcon data-icon="inline-start" />
            <span className="hidden lg:inline">Download</span>
          </LoadingButton>
          <LoadingButton
            type="button"
            variant="glow"
            size="icon-sm"
            className="lg:h-10 lg:w-auto lg:px-6"
            loading={isSaving}
            loadingText={<span className="hidden lg:inline">Saving...</span>}
            disabled={!isReady || isDownloading || !isDirty}
            aria-label="Save PDF"
            onClick={handleSave}
          >
            <SaveIcon data-icon="inline-start" />
            <span className="hidden lg:inline">Save</span>
          </LoadingButton>
          <ThemeToggle className="size-9 lg:size-10" />
          <Link
            href="/dashboard"
            aria-label="Dashboard"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "lg:hidden"
            )}
          >
            <LayoutDashboardIcon />
          </Link>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "hidden lg:inline-flex"
            )}
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "hidden lg:inline-flex"
            )}
          >
            Dashboard
          </Link>
        </div>
      </div>
      <p className="min-w-0 truncate border-t border-border px-2 py-1.5 text-xs text-muted-foreground lg:hidden">
        {fileName}
      </p>
    </header>
  )
}
