"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { deleteDocument, DocumentApiError } from "@/lib/documents/browser"

type DeleteDocumentButtonProps = {
  documentId: string
  fileName: string
}

export function DeleteDocumentButton({
  documentId,
  fileName,
}: DeleteDocumentButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)

    try {
      await deleteDocument(documentId)
      toast.success("Document deleted.")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Failed to delete document:", error)

      if (error instanceof DocumentApiError) {
        toast.error(error.message)
        return
      }

      toast.error("The document could not be deleted.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button type="button" variant="destructive" size="sm" />}
      >
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete document</AlertDialogTitle>
          <AlertDialogDescription>
            Delete {fileName}? This removes the PDF from storage and cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <LoadingButton
            type="button"
            variant="destructive"
            loading={isDeleting}
            loadingText="Deleting..."
            onClick={handleDelete}
          >
            Delete
          </LoadingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
