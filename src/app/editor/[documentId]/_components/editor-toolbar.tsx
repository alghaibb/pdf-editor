"use client"

import { useState } from "react"
import Link from "next/link"
import { DownloadIcon, SaveIcon } from "lucide-react"
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
        <LoadingButton
          type="button"
          variant="outline"
          loading={isDownloading}
          loadingText="Downloading..."
          disabled={!isReady || isSaving}
          onClick={handleDownload}
        >
          <DownloadIcon data-icon="inline-start" />
          Download
        </LoadingButton>
        <LoadingButton
          type="button"
          variant="glow"
          loading={isSaving}
          loadingText="Saving..."
          disabled={!isReady || isDownloading || !isDirty}
          onClick={handleSave}
        >
          <SaveIcon data-icon="inline-start" />
          Save
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
