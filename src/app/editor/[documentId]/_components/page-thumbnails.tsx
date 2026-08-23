"use client"

import { useEffect, useState } from "react"
import { RotateCwIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useEditorStore } from "@/stores/editor-store"
import { LastPageError } from "../_lib/delete-pages"

type PageThumbnailsProps = {
  onJumpToPage: (page: number) => void
  onDeletePage: (page: number) => Promise<void>
  onRotatePage: (page: number) => Promise<void>
  onLoadThumbnail: (page: number) => Promise<string>
}

export function PageThumbnails({
  onJumpToPage,
  onDeletePage,
  onRotatePage,
  onLoadThumbnail,
}: PageThumbnailsProps) {
  const isReady = useEditorStore((state) => state.isReady)
  const currentPage = useEditorStore((state) => state.currentPage)
  const pageCount = useEditorStore((state) => state.pageCount)
  const pageEpoch = useEditorStore((state) => state.pageEpoch)
  const isSaving = useEditorStore((state) => state.isSaving)
  const isFinalizing = useEditorStore((state) => state.isFinalizing)
  const [thumbCache, setThumbCache] = useState<{
    epoch: number
    byPage: Record<number, string>
  }>({ epoch: -1, byPage: {} })
  const thumbs = thumbCache.epoch === pageEpoch ? thumbCache.byPage : {}
  const [busyPage, setBusyPage] = useState<number | null>(null)
  const isBusy = !isReady || isSaving || isFinalizing || busyPage !== null
  const pages = Array.from({ length: Math.max(pageCount, 0) }, (_, index) => index + 1)

  useEffect(() => {
    if (!isReady || pageCount < 1) {
      return
    }

    let isCancelled = false
    const pagesToLoad = Array.from(
      { length: pageCount },
      (_, index) => index + 1
    )

    void (async () => {
      const byPage: Record<number, string> = {}

      for (const page of pagesToLoad) {
        if (isCancelled) {
          return
        }

        try {
          byPage[page] = await onLoadThumbnail(page)

          if (isCancelled) {
            return
          }

          setThumbCache({ epoch: pageEpoch, byPage: { ...byPage } })
        } catch (error) {
          console.error("Failed to load page thumbnail:", error)
        }
      }
    })()

    return () => {
      isCancelled = true
    }
  }, [isReady, pageCount, pageEpoch, onLoadThumbnail])

  async function handleDelete(page: number) {
    setBusyPage(page)

    try {
      await onDeletePage(page)
    } catch (error) {
      console.error("Failed to delete page from thumbnails:", error)
      toast.error(
        error instanceof LastPageError
          ? error.message
          : "The page could not be deleted."
      )
    } finally {
      setBusyPage(null)
    }
  }

  async function handleRotate(page: number) {
    setBusyPage(page)

    try {
      await onRotatePage(page)
    } catch (error) {
      console.error("Failed to rotate page from thumbnails:", error)
      toast.error(
        error instanceof Error ? error.message : "The page could not be rotated."
      )
    } finally {
      setBusyPage(null)
    }
  }

  return (
    <>
      <aside className="hidden h-full w-36 shrink-0 flex-col border-r border-border bg-background md:flex">
        <div className="flex shrink-0 items-baseline justify-between px-3 py-2">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Pages
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            {currentPage}/{pageCount || 1}
          </p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3">
          {pages.map((page) => (
            <RailPage
              key={`${pageEpoch}-${page}`}
              page={page}
              src={thumbs[page]}
              isCurrent={page === currentPage}
              isBusy={isBusy}
              canDelete={pageCount > 1}
              onJump={() => onJumpToPage(page)}
              onRotate={() => void handleRotate(page)}
              onDelete={() => void handleDelete(page)}
            />
          ))}
        </div>
      </aside>
      <nav
        aria-label="Document pages"
        className="order-last flex shrink-0 flex-col border-t border-border bg-background pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
      >
        <div className="flex items-baseline justify-between px-3 pt-2">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Pages
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            {currentPage} / {pageCount || 1}
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto px-3 py-2">
          {pages.map((page) => {
            const src = thumbs[page]
            const isCurrent = page === currentPage

            return (
              <button
                key={`${pageEpoch}-${page}`}
                type="button"
                disabled={isBusy}
                onClick={() => onJumpToPage(page)}
                className={cn(
                  "w-14 shrink-0 overflow-hidden border bg-muted/40",
                  isCurrent
                    ? "border-foreground"
                    : "border-border"
                )}
                aria-current={isCurrent ? "page" : undefined}
                aria-label={`Go to page ${page}`}
              >
                {src ? (
                  // Thumbnail data URLs are generated in this browser from
                  // the open PDF; they are not remote user-controlled srcs.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt=""
                    className="aspect-3/4 w-full object-contain"
                  />
                ) : (
                  <Skeleton className="aspect-3/4 w-full" />
                )}
                <span className="block py-0.5 font-mono text-[10px] text-muted-foreground">
                  {String(page).padStart(2, "0")}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}

function RailPage({
  page,
  src,
  isCurrent,
  isBusy,
  canDelete,
  onJump,
  onRotate,
  onDelete,
}: {
  page: number
  src?: string
  isCurrent: boolean
  isBusy: boolean
  canDelete: boolean
  onJump: () => void
  onRotate: () => void
  onDelete: () => void
}) {
  return (
    <div className="group/page flex flex-col gap-1.5">
      <button
        type="button"
        disabled={isBusy}
        onClick={onJump}
        className={cn(
          "block w-full overflow-hidden border bg-muted/40",
          isCurrent
            ? "border-foreground"
            : "border-border hover:border-foreground/50"
        )}
        aria-current={isCurrent ? "page" : undefined}
        aria-label={`Go to page ${page}`}
      >
        {src ? (
          // Thumbnail data URLs are generated in this browser from
          // the open PDF; they are not remote user-controlled srcs.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="aspect-3/4 w-full object-contain"
          />
        ) : (
          <Skeleton className="aspect-3/4 w-full" />
        )}
      </button>
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
          {String(page).padStart(2, "0")}
        </span>
        <span
          className={cn(
            "flex gap-0.5 transition-opacity",
            isCurrent
              ? "opacity-100"
              : "opacity-0 group-hover/page:opacity-100 group-focus-within/page:opacity-100"
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isBusy}
            aria-label={`Rotate page ${page}`}
            onClick={onRotate}
          >
            <RotateCwIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isBusy || !canDelete}
            className="text-muted-foreground hover:text-destructive"
            aria-label={`Delete page ${page}`}
            onClick={onDelete}
          >
            <Trash2Icon />
          </Button>
        </span>
      </div>
    </div>
  )
}
