"use client"

import Link from "next/link"
import { MenuIcon } from "lucide-react"

import { SignOutButton } from "@/components/sign-out-button"
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

type HomeMobileNavProps = {
  isAuthenticated: boolean
}

export function HomeMobileNav({ isAuthenticated }: HomeMobileNavProps) {
  return (
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
                    className={cn(buttonVariants({ variant: "glow" }), "w-full")}
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
  )
}
