import { FileUpIcon, PenLineIcon, SaveIcon } from "lucide-react"

const STEPS = [
  {
    index: "01",
    title: "Open",
    copy: "The PDF loads with its real text still in the file.",
    icon: FileUpIcon,
  },
  {
    index: "02",
    title: "Rewrite",
    copy: "The date is selected and typed over. Nothing is covered up.",
    icon: PenLineIcon,
  },
  {
    index: "03",
    title: "Save",
    copy: "The new date is written into the file, then it stays there.",
    icon: SaveIcon,
  },
] as const

export function HomeSteps() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-28 bg-muted/40 px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-32"
    >
      <div className="mx-auto w-full max-w-6xl">
        <p className="text-center text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
          Switch in three steps
        </p>
        <h2 className="font-heading mx-auto mt-4 max-w-2xl text-center text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          Open. Rewrite. Save.
        </h2>
        <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((step) => (
            <li key={step.index} className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tracking-[0.24em] text-muted-foreground">
                  {step.index}
                </span>
                <step.icon className="size-4 text-muted-foreground" />
              </div>
              <h3 className="font-heading text-3xl font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {step.copy}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
