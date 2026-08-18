import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function EditorDocumentNotFound() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col justify-center gap-4 px-6 py-16">
      <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        Editor
      </p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Document not found
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        This PDF is missing, still uploading, or you do not have access to it.
      </p>
      <Link
        href="/dashboard"
        className={cn(buttonVariants({ variant: "glow" }), "w-fit")}
      >
        Back to dashboard
      </Link>
    </div>
  )
}
