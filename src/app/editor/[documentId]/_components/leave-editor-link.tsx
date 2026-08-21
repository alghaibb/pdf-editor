"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useEditorStore } from "@/stores/editor-store"

type LeaveEditorLinkProps = {
  href: string
  className?: string
  "aria-label"?: string
  children: React.ReactNode
}

/**
 * beforeunload only covers hard navigations. Client-side route changes would
 * silently discard unsaved PDF edits, so links leaving the editor confirm
 * first when the document is dirty.
 */
export function LeaveEditorLink({
  href,
  className,
  children,
  ...rest
}: LeaveEditorLinkProps) {
  const router = useRouter()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  return (
    <>
      <Link
        href={href}
        className={className}
        onClick={(event) => {
          const { isDirty, isFinalizing } = useEditorStore.getState()

          if (!isDirty && !isFinalizing) {
            return
          }

          event.preventDefault()
          setIsConfirmOpen(true)
        }}
        {...rest}
      >
        {children}
      </Link>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>
              This document has changes that are not fully saved yet. They
              will be lost if you leave now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setIsConfirmOpen(false)
                router.push(href)
              }}
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
