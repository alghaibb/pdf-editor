import { cacheLife } from "next/cache"

const CAPABILITIES = [
  {
    index: "01",
    title: "Existing text",
    copy: "Click a date, a name, a clause. Type over it. The original text is replaced.",
  },
  {
    index: "02",
    title: "Images & pages",
    copy: "Move, replace, rotate, or remove pages without exporting to another tool.",
  },
  {
    index: "03",
    title: "Marks & forms",
    copy: "Annotations, signatures, and form fields write into the same document.",
  },
  {
    index: "04",
    title: "Version history",
    copy: "Every save keeps a copy. Restore an earlier one without losing the current file.",
  },
] as const

export async function HomeCapabilities() {
  "use cache"
  cacheLife("max")

  return (
    <section
      id="capabilities"
      className="scroll-mt-28 border-y border-border px-5 py-16 sm:px-8 sm:py-20 lg:px-12"
    >
      <div className="mx-auto w-full max-w-6xl">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-muted-foreground uppercase">
          In the file
        </p>
        <h2 className="font-heading mt-4 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
          A studio for the PDF you already have.
        </h2>
        <ul className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {CAPABILITIES.map((item) => (
            <li
              key={item.index}
              className="flex flex-col border-t border-border pt-5"
            >
              <span className="font-mono text-[11px] tracking-[0.24em] text-muted-foreground">
                {item.index}
              </span>
              <h3 className="font-heading mt-4 text-2xl font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.copy}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
