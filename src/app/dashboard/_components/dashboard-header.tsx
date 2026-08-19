"use client";

import Link from "next/link";

import { DashboardIndex } from "@/app/dashboard/_components/dashboard-index";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOutAction } from "@/lib/auth/actions";

type DashboardHeaderProps = {
  userName?: string;
  userEmail?: string;
};

export function DashboardHeader({ userName, userEmail }: DashboardHeaderProps) {
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
          <ThemeToggle />
          <form action={signOutAction}>
            <SignOutButton />
          </form>
        </nav>
        <div className="md:hidden">
          {userName && userEmail ? (
            <DashboardIndex userName={userName} userEmail={userEmail} />
          ) : (
            <ThemeToggle />
          )}
        </div>
      </div>
    </header>
  );
}
