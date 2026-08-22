type DashboardHeroProps = {
  firstName?: string
}

export function firstNameFrom(name: string) {
  const firstName = name.trim().split(/\s+/)[0]
  return firstName.length > 0 ? firstName : "there"
}

export function DashboardHero({ firstName }: DashboardHeroProps) {
  return (
    <section className="px-5 pt-10 pb-6 sm:px-8 sm:pt-14 sm:pb-8 lg:px-12 lg:pt-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-muted-foreground uppercase">
          {firstName ? `Studio / ${firstName}` : "Studio"}
        </p>
        <h1 className="font-heading mt-4 max-w-3xl text-4xl leading-[0.94] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Your files.
          <span className="mt-2 block italic">Ready to rewrite.</span>
        </h1>
      </div>
    </section>
  )
}
