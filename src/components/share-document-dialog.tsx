"use client"

import { useEffect, useState, type ReactElement } from "react"
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
  fetchDocumentShares,
  revokeDocumentShare,
  type DocumentShareSummary,
} from "@/lib/documents/browser"
import { cn } from "@/lib/utils"

const SHARE_DURATIONS = [
  { hours: 1, label: "1 hour" },
  { hours: 24, label: "24 hours" },
  { hours: 168, label: "7 days" },
] as const

type ShareHours = (typeof SHARE_DURATIONS)[number]["hours"]

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
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open ?? internalOpen
  const [hours, setHours] = useState<ShareHours>(24)
  const [isCreating, setIsCreating] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [createdUrl, setCreatedUrl] = useState<string | null>(null)
  const [shares, setShares] = useState<DocumentShareSummary[]>([])
  const [hasLoadedShares, setHasLoadedShares] = useState(false)
  const isLoadingShares = isOpen && !hasLoadedShares

  function handleOpenChange(nextOpen: boolean) {
    if (open === undefined) {
      setInternalOpen(nextOpen)
    }

    onOpenChange?.(nextOpen)

    if (!nextOpen) {
      setCreatedUrl(null)
      setHours(24)
      setShares([])
      setHasLoadedShares(false)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    let isCancelled = false

    fetchDocumentShares(documentId)
      .then((result) => {
        if (!isCancelled) {
          setShares(result.shares ?? [])
          setHasLoadedShares(true)
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to load download links:", error)

        if (!isCancelled) {
          setShares([])
          setHasLoadedShares(true)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [documentId, isOpen])

  async function handleCreate() {
    setIsCreating(true)

    try {
      const result = await createDocumentShareLink(documentId, hours)
      setCreatedUrl(result.url)
      setShares((current) => [
        {
          id: result.id,
          url: result.url,
          version: result.version,
          expiresAt: result.expiresAt,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ])
      toast.success(`Link created for saved version ${result.version}.`)
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

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Download link copied.")
    } catch (error) {
      console.error("Failed to copy download link:", error)
      toast.error("Could not copy the link. Select it and copy it yourself.")
    }
  }

  async function handleRevoke(shareId: string) {
    setRevokingId(shareId)

    try {
      await revokeDocumentShare(documentId, shareId)
      setShares((current) =>
        current.filter((share) => share.id !== shareId)
      )
      toast.success("Download link turned off.")
    } catch (error) {
      console.error("Failed to revoke download link:", error)
      toast.error(
        error instanceof DocumentApiError
          ? error.message
          : "The download link could not be turned off."
      )
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger}>{triggerLabel}</DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send a download link</DialogTitle>
          <DialogDescription>
            The recipient can download the file as it is saved right now. They
            cannot open the editor. Later saves and unsaved edits are not
            included. Turn a link off any time, or wait for it to expire.
          </DialogDescription>
        </DialogHeader>
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
        {createdUrl ? (
          <p className="break-all border border-border px-3 py-2 font-mono text-xs">
            {createdUrl}
          </p>
        ) : null}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Live links
          </p>
          {isLoadingShares ? (
            <p className="text-sm text-muted-foreground">Loading links…</p>
          ) : shares.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No live links. Create one to send this saved copy.
            </p>
          ) : (
            shares.map((share) => (
              <div
                key={share.id}
                className="flex flex-col gap-2 border border-border px-3 py-2"
              >
                <p className="break-all font-mono text-xs">{share.url}</p>
                <p className="text-xs text-muted-foreground">
                  Version {share.version} · expires{" "}
                  {format(new Date(share.expiresAt), "dd/MM/yyyy h:mm a")}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => void handleCopy(share.url)}
                  >
                    Copy
                  </Button>
                  <LoadingButton
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="text-muted-foreground hover:text-destructive"
                    loading={revokingId === share.id}
                    loadingText="Turning off..."
                    onClick={() => void handleRevoke(share.id)}
                  >
                    Turn off
                  </LoadingButton>
                </div>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          {createdUrl ? (
            <Button type="button" onClick={() => void handleCopy(createdUrl)}>
              Copy new link
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
