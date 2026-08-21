import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type HomeCloseProps = {
  isAuthenticated: boolean
}

export function HomeClose({ isAuthenticated }: HomeCloseProps) {
  return (
    <section className="bg-foreground px-5 py-24 text-background sm:px-8 sm:py-28 lg:px-12 lg:py-32">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <h2 className="font-heading text-4xl leading-[0.95] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Upload a PDF.
          <span className="mt-2 block">Change a date.</span>
          <span className="mt-2 block italic">Reopen it.</span>
        </h2>
        <p className="mt-6 max-w-md text-base leading-relaxed text-background/70 sm:text-lg">
          If the words are still different after you close the editor, the file
          itself changed.
        </p>
        {isAuthenticated ? (
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-10 bg-background text-foreground hover:bg-background/90"
            )}
          >
            Open dashboard
          </Link>
        ) : (
          <Link
            href="/sign-up"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-10 bg-background text-foreground hover:bg-background/90"
            )}
          >
            Get started
          </Link>
        )}
      </div>
    </section>
  )
}
