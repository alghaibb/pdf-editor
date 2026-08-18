"use client"

import Link from "next/link"
import { DownloadIcon, RotateCcwIcon } from "lucide-react"
import { toast } from "sonner"

import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { cn } from "@/lib/utils"
import { useEditorStore } from "@/stores/editor-store"
import { OpenPdfButton } from "@/app/editor/_components/open-pdf-button"
import { SaveStatus } from "@/app/editor/_components/save-status"

type EditorToolbarProps = {
  onOpen: (file: File) => Promise<void>
  onExportAndReload: () => Promise<void>
  onDownload: () => Promise<void>
}

export function EditorToolbar({
  onOpen,
  onExportAndReload,
  onDownload,
}: EditorToolbarProps) {
  const fileName = useEditorStore((state) => state.fileName)
  const isReady = useEditorStore((state) => state.isReady)
  const isExporting = useEditorStore((state) => state.isExporting)

  async function handleExportAndReload() {
    try {
      await onExportAndReload()
      toast.success("Exported and reloaded. Confirm your edit is still there.")
    } catch (error) {
      console.error("Failed to export and reload PDF:", error)
      toast.error("Could not export the PDF.")
    }
  }

  async function handleDownload() {
    try {
      await onDownload()
      toast.success("PDF downloaded.")
    } catch (error) {
      console.error("Failed to download PDF:", error)
      toast.error("Could not download the PDF.")
    }
  }

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-3 md:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <Link
          href="/dashboard"
          className="font-heading text-sm font-semibold tracking-[0.2em] uppercase"
        >
          PDF Editor
        </Link>
        <div className="hidden min-w-0 flex-col sm:flex">
          <p className="truncate text-sm font-medium">{fileName}</p>
          <SaveStatus />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="sm:hidden">
          <SaveStatus />
        </div>
        <OpenPdfButton disabled={!isReady || isExporting} onOpen={onOpen} />
        <LoadingButton
          type="button"
          variant="outline"
          loading={isExporting}
          loadingText="Exporting..."
          disabled={!isReady}
          onClick={handleExportAndReload}
        >
          <RotateCcwIcon data-icon="inline-start" />
          Export & reload
        </LoadingButton>
        <LoadingButton
          type="button"
          variant="glow"
          loading={isExporting}
          loadingText="Saving..."
          disabled={!isReady}
          onClick={handleDownload}
        >
          <DownloadIcon data-icon="inline-start" />
          Download
        </LoadingButton>
        <ThemeToggle />
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          Dashboard
        </Link>
      </div>
    </header>
  )
}
