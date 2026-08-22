import Link from "next/link"

import { HomeMobileNav } from "@/app/(home)/_components/home-mobile-nav"
import { SignOutButton } from "@/components/sign-out-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { signOutAction } from "@/lib/auth/actions"
import { cn } from "@/lib/utils"

type HomeHeaderProps = {
  isAuthenticated: boolean
}

export function HomeHeader({ isAuthenticated }: HomeHeaderProps) {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-border bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/45">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="font-heading text-sm font-semibold tracking-[0.22em] uppercase"
        >
          PDF Editor
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="#difference"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            The difference
          </Link>
          <Link
            href="#how-it-works"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            How it works
          </Link>
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "glow" }))}
              >
                Dashboard
              </Link>
              <form action={signOutAction}>
                <SignOutButton />
              </form>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className={cn(buttonVariants({ variant: "ghost" }))}
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className={cn(buttonVariants({ variant: "glow" }))}
              >
                Get started
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <HomeMobileNav isAuthenticated={isAuthenticated} />
        </div>
      </div>
    </header>
  )
}
