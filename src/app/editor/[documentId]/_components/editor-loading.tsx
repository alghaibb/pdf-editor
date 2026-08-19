import { Skeleton } from "@/components/ui/skeleton"

export function EditorLoading() {
  return (
    <div className="flex h-dvh min-h-0 min-w-0 flex-col overflow-hidden bg-background">
      <header className="min-w-0 shrink-0 border-b border-border">
        <div className="flex min-w-0 items-center gap-2 px-2 py-2 sm:px-4 lg:gap-4 lg:px-6">
          <p className="font-heading shrink-0 text-xs font-semibold tracking-[0.14em] uppercase lg:text-sm lg:tracking-[0.2em]">
            PDF Editor
          </p>
          <Skeleton className="hidden h-4 w-48 lg:block" />
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <Skeleton className="size-9 lg:h-10 lg:w-28" />
            <Skeleton className="size-9 lg:h-10 lg:w-24" />
            <Skeleton className="size-9 lg:size-10" />
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 items-center justify-center bg-muted/20 p-6">
        <Skeleton className="h-full max-h-[52rem] w-full max-w-3xl" />
      </div>
    </div>
  )
}
