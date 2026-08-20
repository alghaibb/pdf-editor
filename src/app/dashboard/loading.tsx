import { DashboardFolioSkeleton } from "@/app/dashboard/_components/dashboard-folio-skeleton"

export default function DashboardLoading() {
  return (
    <section className="px-5 pb-24 sm:px-8 lg:px-12 lg:pb-32">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <DashboardFolioSkeleton />
      </div>
    </section>
  )
}
