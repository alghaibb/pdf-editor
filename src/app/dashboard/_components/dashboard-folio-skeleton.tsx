import { DashboardCropFrame } from "@/app/dashboard/_components/dashboard-crop-frame"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardFolioSkeleton() {
  return (
    <div className="flex flex-col gap-14">
      <DashboardCropFrame>
        <div className="border border-border bg-background px-6 py-8 sm:px-8 sm:py-6">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-8 w-64 max-w-full" />
          <Skeleton className="mt-3 h-4 w-80 max-w-full" />
          <Skeleton className="mt-8 h-10 w-36" />
        </div>
      </DashboardCropFrame>
      <div>
        <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.28em] text-muted-foreground uppercase">
              Studio / files
            </p>
            <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
              Folio
            </h2>
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
        <ul>
          {["a", "b", "c"].map((row) => (
            <li
              key={row}
              className="flex flex-col gap-4 border-b border-border py-6 sm:flex-row sm:items-end sm:justify-between sm:py-7"
            >
              <div className="flex min-w-0 items-start gap-5">
                <Skeleton className="mt-3 h-3 w-6" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-8 w-52 max-w-full sm:h-9" />
                  <Skeleton className="mt-3 h-3 w-40" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-16" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
