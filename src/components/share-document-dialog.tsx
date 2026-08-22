"use client"

import { useState, type ReactElement } from "react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  createDocumentShareLink,
  DocumentApiError,
} from "@/lib/documents/browser"
import { cn } from "@/lib/utils"

const SHARE_DURATIONS = [
  { hours: 1, label: "1 hour" },
  { hours: 24, label: "24 hours" },
  { hours: 168, label: "7 days" },
] as const

type ShareHours = (typeof SHARE_DURATIONS)[number]["hours"]

type CreatedShare = {
  url: string
  expiresAt: string
}

type ShareDocumentDialogProps = {
  documentId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: ReactElement
  triggerLabel?: string
}

export function ShareDocumentDialog({
  documentId,
  open,
  onOpenChange,
  trigger,
  triggerLabel = "Send",
}: ShareDocumentDialogProps) {
  const [hours, setHours] = useState<ShareHours>(24)
  const [isCreating, setIsCreating] = useState(false)
  const [created, setCreated] = useState<CreatedShare | null>(null)

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange?.(nextOpen)

    if (!nextOpen) {
      setCreated(null)
      setHours(24)
    }
  }

  async function handleCreate() {
    setIsCreating(true)

    try {
      const result = await createDocumentShareLink(documentId, hours)
      setCreated({
        url: result.url,
        expiresAt: result.expiresAt,
      })
    } catch (error) {
      console.error("Failed to create download link:", error)
      toast.error(
        error instanceof DocumentApiError
          ? error.message
          : "The download link could not be created."
      )
    } finally {
      setIsCreating(false)
    }
  }

  async function handleCopy() {
    if (!created) {
      return
    }

    try {
      await navigator.clipboard.writeText(created.url)
      toast.success("Download link copied.")
    } catch (error) {
      console.error("Failed to copy download link:", error)
      toast.error("Could not copy the link. Select it and copy it yourself.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger}>{triggerLabel}</DialogTrigger>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send a download link</DialogTitle>
          <DialogDescription>
            Anyone with the link can download the latest saved file. They
            cannot open the editor. The link expires automatically.
          </DialogDescription>
        </DialogHeader>
        {created ? (
          <div className="flex flex-col gap-3">
            <p className="break-all border border-border px-3 py-2 font-mono text-xs">
              {created.url}
            </p>
            <p className="text-sm text-muted-foreground">
              Expires {format(new Date(created.expiresAt), "dd/MM/yyyy h:mm a")}
              .
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Expires after
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SHARE_DURATIONS.map((option) => (
                <Button
                  key={option.hours}
                  type="button"
                  variant={hours === option.hours ? "default" : "outline"}
                  size="sm"
                  className={cn(hours === option.hours && "pointer-events-none")}
                  onClick={() => setHours(option.hours)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        )}
        <DialogFooter>
          {created ? (
            <Button type="button" onClick={() => void handleCopy()}>
              Copy link
            </Button>
          ) : (
            <LoadingButton
              type="button"
              loading={isCreating}
              loadingText="Creating..."
              onClick={() => void handleCreate()}
            >
              Create link
            </LoadingButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
