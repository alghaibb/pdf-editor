import { cacheLife } from "next/cache"
import { FileUpIcon, PenLineIcon, SaveIcon } from "lucide-react"

const STEPS = [
  {
    index: "01",
    title: "Open",
    copy: "Upload a PDF. The document loads with its real text still in the file — selectable, not a picture of words.",
    icon: FileUpIcon,
  },
  {
    index: "02",
    title: "Rewrite",
    copy: "Click a date or a name and type over it. Nothing is covered. The original line is replaced.",
    icon: PenLineIcon,
  },
  {
    index: "03",
    title: "Save",
    copy: "The new wording is written into the PDF. Close the editor, reopen the file, and it is still there.",
    icon: SaveIcon,
  },
] as const

export async function HomeSteps() {
  "use cache"
  cacheLife("max")

  return (
    <section
      id="how-it-works"
      className="scroll-mt-28 bg-muted/40 px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-32"
    >
      <div className="mx-auto w-full max-w-6xl">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-muted-foreground uppercase">
          Three steps
        </p>
        <h2 className="font-heading mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          Open. Rewrite. Save.
        </h2>
        <ol className="mt-14 grid gap-0 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.index}
              className={
                index === 0
                  ? "flex flex-col gap-5 py-8 sm:py-0 sm:pr-8"
                  : "flex flex-col gap-5 border-t border-border py-8 sm:border-t-0 sm:border-l sm:py-0 sm:pr-8 sm:pl-8 sm:last:pr-0"
              }
            >
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
