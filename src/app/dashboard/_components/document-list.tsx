import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DeleteDocumentButton } from "@/app/dashboard/_components/delete-document-button"

type DocumentListItem = {
  id: string
  name: string
}

type DocumentListProps = {
  documents: DocumentListItem[]
}

export function DocumentList({ documents }: DocumentListProps) {
  return (
    <ul className="divide-y divide-border border border-border">
      {documents.map((document) => (
        <li key={document.id}>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="min-w-0 truncate text-sm font-medium">
              {document.name}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/editor/${document.id}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" })
                )}
              >
                Open
              </Link>
              <DeleteDocumentButton
                documentId={document.id}
                fileName={document.name}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
