import { cacheLife } from "next/cache"

import { HomeContrast } from "@/app/(home)/_components/home-contrast"

export async function HomeProof() {
  "use cache"
  cacheLife("max")
  return (
    <section
      id="difference"
      className="scroll-mt-28 px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col lg:flex-row lg:items-end lg:justify-between lg:gap-16">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-muted-foreground uppercase">
            The difference
          </p>
          <h2 className="font-heading mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            White boxes over text
            <span className="italic"> are not editing.</span>
          </h2>
        </div>
        <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground lg:mt-0">
          Most browser tools hide the original line. This one changes the words
          inside the PDF, then saves that file.
        </p>
      </div>
      <div className="mx-auto mt-12 w-full max-w-6xl">
        <HomeContrast />
      </div>
    </section>
  )
}
