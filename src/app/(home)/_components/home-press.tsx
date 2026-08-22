function CropCorner({ className }: { className?: string }) {
  return <span aria-hidden="true" className={className} />
}

export function HomePress() {
  return (
    <div className="relative mx-auto w-full min-w-0 max-w-lg lg:mx-0">
      <CropCorner className="absolute -top-2 -left-2 size-4 border-t border-l border-foreground" />
      <CropCorner className="absolute -top-2 -right-2 size-4 border-t border-r border-foreground" />
      <CropCorner className="absolute -bottom-2 -left-2 size-4 border-b border-l border-foreground" />
      <CropCorner className="absolute -bottom-2 -right-2 size-4 border-b border-r border-foreground" />
      <article className="border border-border bg-background px-6 py-7 sm:px-8 sm:py-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="font-heading text-sm font-semibold tracking-[0.22em] uppercase">
              North &amp; Co.
            </p>
            <p className="mt-1 text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              Invoice INV-0847
            </p>
          </div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
            02 / 02
          </p>
        </header>

        <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-border pt-6">
          <div>
            <dt className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Billed to
            </dt>
            <dd className="mt-2 text-sm">Alex Rivera</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Invoice date
            </dt>
            <dd className="mt-2">
              <span className="block text-sm text-muted-foreground line-through">
                15 August 2026
              </span>
              <span className="font-heading mt-1 block text-3xl leading-[0.95] font-semibold tracking-tight sm:text-4xl">
                17 August 2026
              </span>
            </dd>
          </div>
        </dl>

        <table className="mt-8 w-full border-t border-border text-sm">
          <caption className="sr-only">Invoice line items</caption>
          <thead>
            <tr className="text-left text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              <th scope="col" className="pt-6 pb-3 font-semibold">
                Item
              </th>
              <th scope="col" className="pt-6 pb-3 text-right font-semibold">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="py-3">Retainer — August</td>
              <td className="py-3 text-right tabular-nums">2,400.00</td>
            </tr>
            <tr className="border-t border-border">
              <td className="py-3">Revision round</td>
              <td className="py-3 text-right tabular-nums">350.00</td>
            </tr>
          </tbody>
        </table>

        <footer className="mt-6 flex items-center justify-between border-t border-border pt-5">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase">
            Saved
          </p>
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
            Version 2
          </p>
        </footer>
      </article>
    </div>
  )
}
