import Link from "next/link"

import { HomePress } from "@/app/(home)/_components/home-press"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type HomeHeroProps = {
  isAuthenticated: boolean
}

export function HomeHero({ isAuthenticated }: HomeHeroProps) {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-20">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-muted-foreground uppercase">
            Studio / PDF
          </p>
          <h1 className="font-heading mt-5 max-w-xl text-5xl leading-[0.94] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Change the date.
            <span className="mt-2 block italic">Keep the file.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            Edit the words already in the PDF. Save. Close it. Open it again —
            the change is still in the file, not sitting on top of it.
          </p>
          <div className="mt-10 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ size: "lg", variant: "glow" }))}
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-up"
                  className={cn(buttonVariants({ size: "lg", variant: "glow" }))}
                >
                  Create account
                </Link>
                <Link
                  href="/sign-in"
                  className={cn(buttonVariants({ size: "lg", variant: "ghost" }))}
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
        <HomePress />
      </div>
    </section>
  )
}
