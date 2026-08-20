"use client"

import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DocumentSnapshot } from "@/lib/documents/outbox"
import { DeleteDocumentButton } from "@/app/dashboard/_components/delete-document-button"
import { DocumentName } from "@/app/dashboard/_components/document-name"
import { DocumentUpdatedAt } from "@/app/dashboard/_components/document-updated-at"

type DocumentListProps = {
  documents: DocumentSnapshot[]
  onRename: (documentId: string, name: string) => void
  onDelete: (documentId: string) => void
}

export function DocumentList({
  documents,
  onRename,
  onDelete,
}: DocumentListProps) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight">
          Folio
        </h2>
        <p className="text-[11px] font-semibold tracking-[0.28em] text-muted-foreground uppercase">
          {String(documents.length).padStart(2, "0")}{" "}
          {documents.length === 1 ? "file" : "files"}
        </p>
      </div>
      <ul>
        {documents.map((document, index) => (
          <li
            key={document.id}
            className="border-b border-border py-6 sm:py-7"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
              <div className="flex min-w-0 items-start gap-5">
                <span className="font-mono mt-2 shrink-0 text-[11px] tracking-[0.24em] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <DocumentName
                    name={document.name}
                    onRename={(name) => onRename(document.id, name)}
                  />
                  <DocumentUpdatedAt value={document.updatedAt} />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:pb-0.5">
                <Link
                  href={`/editor/${document.id}`}
                  prefetch
                  className={cn(
                    buttonVariants({ variant: "glow", size: "sm" })
                  )}
                >
                  Open
                </Link>
                <DeleteDocumentButton
                  fileName={document.name}
                  onConfirm={() => onDelete(document.id)}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
