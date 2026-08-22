export function HomeContrast() {
  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
      <figure className="flex min-w-0 flex-col gap-3">
        <figcaption className="flex items-baseline justify-between gap-3">
          <span className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Cover-up
          </span>
          <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
            01
          </span>
        </figcaption>
        <div className="min-w-0 overflow-hidden border border-border bg-muted/40 px-5 py-6 sm:px-6 sm:py-7">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Invoice date
          </p>
          <div className="relative mt-5 min-h-10">
            <p className="text-lg text-muted-foreground/70">15 August 2026</p>
            <span
              aria-hidden="true"
              className="absolute top-1 left-0 h-[1.4em] w-40 bg-white shadow-[0_1px_0_oklch(0.82_0.01_40)] sm:w-44"
            />
            <p className="absolute top-0 left-1 font-sans text-lg tracking-wide text-neutral-900">
              17 August 2026
            </p>
          </div>
          <p className="mt-8 max-w-xs text-xs leading-relaxed text-muted-foreground">
            The original line is still in the file. A white rectangle and a new
            text box sit on top of it.
          </p>
        </div>
      </figure>
      <figure className="flex min-w-0 flex-col gap-3">
        <figcaption className="flex items-baseline justify-between gap-3">
          <span className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Rewrite
          </span>
          <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
            02
          </span>
        </figcaption>
        <div className="min-w-0 border border-border bg-background px-5 py-6 sm:px-6 sm:py-7">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Invoice date
          </p>
          <p className="font-heading mt-5 text-3xl leading-[0.95] font-semibold tracking-tight">
            17 August 2026
          </p>
          <p className="mt-8 max-w-xs text-xs leading-relaxed text-muted-foreground">
            The date in the PDF is the new date. Reopen the file anywhere — it
            is still 17 August.
          </p>
        </div>
      </figure>
    </div>
  )
}
