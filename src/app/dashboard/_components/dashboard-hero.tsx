type DashboardHeroProps = {
  firstName?: string
}

export function firstNameFrom(name: string) {
  const firstName = name.trim().split(/\s+/)[0]
  return firstName.length > 0 ? firstName : "there"
}

export function DashboardHero({ firstName }: DashboardHeroProps) {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-muted-foreground uppercase">
          {firstName ? `Studio / ${firstName}` : "Studio"}
        </p>
        <h1 className="font-heading mt-5 max-w-3xl text-5xl leading-[0.94] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
          Your files.
          <span className="mt-2 block italic">Ready to rewrite.</span>
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
          Open a PDF. Change the words in the file. Save, and they stay
          changed.
        </p>
      </div>
    </section>
  )
}
