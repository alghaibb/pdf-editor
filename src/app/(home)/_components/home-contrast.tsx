export function HomeContrast() {
  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
      <figure className="flex min-w-0 flex-col gap-3">
        <figcaption className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Not this
        </figcaption>
        <div className="min-w-0 overflow-hidden border border-border bg-muted/40 px-5 py-6">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Invoice date
          </p>
          <div className="relative mt-4 h-8 min-w-0">
            <p className="text-lg text-muted-foreground/80">15 August 2026</p>
            <span
              aria-hidden="true"
              className="absolute top-1 left-0 h-[1.35em] w-34 bg-white shadow-[0_1px_0_oklch(0.82_0.01_40)] sm:w-40"
            />
            <p className="absolute top-0 left-1 text-lg tracking-wide text-neutral-900">
              17 August 2026
            </p>
          </div>
        </div>
      </figure>
      <figure className="flex min-w-0 flex-col gap-3">
        <figcaption className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          This
        </figcaption>
        <div className="min-w-0 border border-border bg-background px-5 py-6">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Invoice date
          </p>
          <p className="mt-4 h-8 text-lg">17 August 2026</p>
        </div>
      </figure>
    </div>
  )
}
