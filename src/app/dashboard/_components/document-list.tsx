"use client"

import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DocumentSnapshot } from "@/lib/documents/outbox"
import { DeleteDocumentButton } from "@/app/dashboard/_components/delete-document-button"
import { DuplicateDocumentButton } from "@/app/dashboard/_components/duplicate-document-button"
import { DocumentName } from "@/app/dashboard/_components/document-name"
import { DocumentUpdatedAt } from "@/app/dashboard/_components/document-updated-at"
import { ShareDocumentDialog } from "@/components/share-document-dialog"
import { Button } from "@/components/ui/button"

type DocumentListProps = {
  documents: DocumentSnapshot[]
  onRename: (documentId: string, name: string) => void
  onDuplicate: (documentId: string) => Promise<void>
  onDelete: (documentId: string) => void
}

export function DocumentList({
  documents,
  onRename,
  onDuplicate,
  onDelete,
}: DocumentListProps) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.28em] text-muted-foreground uppercase">
            Studio / files
          </p>
          <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
            Folio
          </h2>
        </div>
        <p className="font-mono text-[11px] tracking-[0.24em] text-muted-foreground">
          {String(documents.length).padStart(2, "0")}{" "}
          {documents.length === 1 ? "file" : "files"}
        </p>
      </div>
      <ul>
        {documents.map((document, index) => (
          <li
            key={document.id}
            className="border-b border-border py-6 transition-colors hover:bg-muted/30 sm:py-7"
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
              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pb-0.5">
                <Link
                  href={`/editor/${document.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Open
                </Link>
                <DuplicateDocumentButton
                  onConfirm={() => onDuplicate(document.id)}
                />
                <ShareDocumentDialog
                  documentId={document.id}
                  trigger={
                    <Button type="button" variant="outline" size="sm" />
                  }
                />
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
