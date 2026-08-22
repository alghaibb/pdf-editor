"use client"

import { useRef, useState } from "react"
import { MoreHorizontalIcon } from "lucide-react"

import { ShareDocumentDialog } from "@/components/share-document-dialog"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useEditorStore } from "@/stores/editor-store"

type EditorMoreActionsProps = {
  documentId: string
  onRecognizeText: () => Promise<void>
  onInsertPages: (file: File) => Promise<void>
}

export function EditorMoreActions({
  documentId,
  onRecognizeText,
  onInsertPages,
}: EditorMoreActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isShareOpen, setIsShareOpen] = useState(false)
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
    </>
  )
}
