import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { HomePress } from "@/app/(home)/_components/home-press"

type HomeHeroProps = {
  isAuthenticated: boolean
}

export function HomeHero({ isAuthenticated }: HomeHeroProps) {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-32">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center text-center">
        <h1 className="font-heading max-w-4xl text-5xl leading-[0.94] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
          Change the date.
          <span className="mt-2 block italic">Keep the file.</span>
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
          Edit the words already in the PDF. Save. Reopen. They’re still
          changed.
        </p>
        <div className="mt-10 flex w-full flex-col items-center gap-3">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ size: "lg", variant: "glow" }))}
            >
              Open dashboard
            </Link>
          ) : (
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ size: "lg", variant: "glow" }))}
            >
              Create account
            </Link>
          )}
          <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
            Upload a PDF · Change a date · Keep the file
          </p>
        </div>
        <div className="mt-16 w-full">
          <HomePress />
        </div>
      </div>
    </section>
  )
}
