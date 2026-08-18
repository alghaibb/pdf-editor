"use client"

import { useEffect } from "react"
import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type EditorErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function EditorError({ error, reset }: EditorErrorProps) {
  useEffect(() => {
    console.error("Editor route failed:", error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col justify-center gap-4 px-6 py-16">
      <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        Editor
      </p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        The editor could not be opened
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Something went wrong while loading the PDF editor. Try again, or return
        to the dashboard.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="glow" onClick={reset}>
          Try again
        </Button>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
