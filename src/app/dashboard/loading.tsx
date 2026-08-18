export default function DashboardLoading() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <div className="h-3 w-24 bg-muted" />
        <div className="h-8 w-64 bg-muted" />
        <div className="h-4 w-48 bg-muted" />
      </div>
      <p className="text-sm text-muted-foreground">Loading documents…</p>
    </div>
  )
}
