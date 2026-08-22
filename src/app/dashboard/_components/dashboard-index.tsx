"use client";

import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { signOutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

type DashboardIndexProps = {
  userName: string;
  userEmail: string;
};

function CropMarksIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="12"
        cy="12"
        r="1.75"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function DashboardIndex({ userName, userEmail }: DashboardIndexProps) {
  return (
    <Dialog>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "gap-2 px-3",
        )}
        aria-label="Open studio index"
      >
        <CropMarksIcon className="size-3.5" />
        <span className="text-[10px] font-semibold tracking-[0.28em] uppercase">
          Index
        </span>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="inset-0 top-0 left-0 h-dvh w-full max-w-none translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-none border-0 bg-background p-0 shadow-none ring-0 sm:max-w-none data-open:zoom-in-100 data-closed:zoom-out-100 data-open:slide-in-from-bottom-3 data-closed:slide-out-to-bottom-3"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--muted)_0%,transparent_55%)] opacity-80" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,transparent_49%,color-mix(in_oklch,var(--border)_55%,transparent)_50%,transparent_51%),linear-gradient(to_bottom,transparent_0%,transparent_49%,color-mix(in_oklch,var(--border)_55%,transparent)_50%,transparent_51%)] bg-size-[48px_48px] opacity-30" />
        <div className="relative flex min-h-dvh flex-col px-6 py-8">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[11px] font-semibold tracking-[0.28em] text-muted-foreground uppercase">
              Folio / 02
            </p>
            <DialogClose
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Close
            </DialogClose>
          </div>

          <DialogTitle className="font-heading mt-10 text-5xl font-semibold tracking-tight normal-case">
            Index
            <span className="mt-1 block text-3xl font-normal italic text-muted-foreground">
              the studio
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Studio navigation for home, appearance, and sign out.
          </DialogDescription>

          <nav className="mt-12 flex flex-col">
            <DialogClose
              nativeButton={false}
              render={
                <Link
                  href="/"
                  className="flex items-baseline gap-5 border-t border-border py-5"
                />
              }
            >
              <span className="font-mono text-[11px] tracking-[0.24em] text-muted-foreground">
                01
              </span>
              <span className="font-heading text-3xl font-semibold tracking-tight">
                Home
              </span>
            </DialogClose>
            <div className="flex items-baseline gap-5 border-t border-border py-5">
              <span className="font-mono text-[11px] tracking-[0.24em] text-muted-foreground">
                02
              </span>
              <span className="font-heading text-3xl font-semibold tracking-tight">
                Documents
              </span>
              <span className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                Now
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-border py-5">
              <div className="flex min-w-0 items-baseline gap-5">
                <span className="font-mono text-[11px] tracking-[0.24em] text-muted-foreground">
                  03
                </span>
                <span className="font-heading text-3xl font-semibold tracking-tight">
                  Appearance
                </span>
              </div>
              <ThemeToggle variant="label" />
            </div>
            <form
              action={signOutAction}
              className="border-t border-b border-border"
            >
              <SignOutButton className="h-auto w-full justify-start gap-5 rounded-none border-0 bg-transparent px-0 py-5 text-left font-normal tracking-normal normal-case hover:bg-transparent">
                <span className="font-mono text-[11px] tracking-[0.24em] text-muted-foreground">
                  04
                </span>
                <span className="font-heading text-3xl font-semibold tracking-tight normal-case">
                  Sign out
                </span>
              </SignOutButton>
            </form>
          </nav>

          <div className="mt-auto border-t border-border pt-8">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Signed in
            </p>
            <p className="font-heading mt-2 text-lg font-semibold tracking-tight">
              {userName}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{userEmail}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
