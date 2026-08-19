import { HomeContrast } from "@/app/(home)/_components/home-contrast"

export function HomeProof() {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <h2 className="font-heading max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          White boxes over text
          <span className="italic"> are not editing.</span>
        </h2>
        <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
          Other tools cover the original. This one changes the words in the
          file.
        </p>
        <div className="mt-12 w-full text-left">
          <HomeContrast />
        </div>
      </div>
    </section>
  )
}
