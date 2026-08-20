"use client"

import Link from "next/link"
import { MenuIcon } from "lucide-react"

import { SignOutButton } from "@/components/sign-out-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
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
                prefetch
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
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Open menu"
                />
              }
            >
              <MenuIcon />
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100%,20rem)]">
              <SheetHeader>
                <SheetTitle>PDF Editor</SheetTitle>
                <SheetDescription>
                  Edit real PDF text, then save the file.
                </SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-2 px-8">
                <SheetClose
                  nativeButton={false}
                  render={
                    <Link
                      href="#how-it-works"
                      className={cn(
                        buttonVariants({ variant: "ghost" }),
                        "w-full justify-start"
                      )}
                    />
                  }
                >
                  How it works
                </SheetClose>
                {isAuthenticated ? (
                  <>
                    <SheetClose
                      nativeButton={false}
                      render={
                        <Link
                          href="/dashboard"
                          className={cn(
                            buttonVariants({ variant: "glow" }),
                            "w-full"
                          )}
                        />
                      }
                    >
                      Dashboard
                    </SheetClose>
                    <form action={signOutAction}>
                      <SignOutButton className="w-full" />
                    </form>
                  </>
                ) : (
                  <>
                    <SheetClose
                      nativeButton={false}
                      render={
                        <Link
                          href="/sign-in"
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "w-full"
                          )}
                        />
                      }
                    >
                      Sign in
                    </SheetClose>
                    <SheetClose
                      nativeButton={false}
                      render={
                        <Link
                          href="/sign-up"
                          className={cn(
                            buttonVariants({ variant: "glow" }),
                            "w-full"
                          )}
                        />
                      }
                    >
                      Get started
                    </SheetClose>
                  </>
                )}
              </nav>
              <SheetFooter>
                <p className="text-xs tracking-widest text-muted-foreground uppercase">
                  Real content. Real files.
                </p>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
