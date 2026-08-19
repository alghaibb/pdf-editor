function CropCorner({ className }: { className?: string }) {
  return <span aria-hidden="true" className={className} />
}

export function HomePress() {
  return (
    <div className="relative mx-auto w-full min-w-0 max-w-lg">
      <CropCorner className="absolute -top-2 -left-2 size-4 border-t border-l border-foreground" />
      <CropCorner className="absolute -top-2 -right-2 size-4 border-t border-r border-foreground" />
      <CropCorner className="absolute -bottom-2 -left-2 size-4 border-b border-l border-foreground" />
      <CropCorner className="absolute -bottom-2 -right-2 size-4 border-b border-r border-foreground" />
      <div className="border border-border bg-background px-6 py-10 sm:px-10 sm:py-12">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-muted-foreground uppercase">
          Invoice date
        </p>
        <p className="mt-6 text-sm text-muted-foreground">15 August 2026</p>
        <p className="font-heading mt-3 text-4xl leading-[0.95] font-semibold tracking-tight sm:text-5xl">
          17 August 2026
        </p>
        <p className="mt-8 text-[11px] font-semibold tracking-[0.2em] uppercase">
          Saved
        </p>
      </div>
    </div>
  )
}
