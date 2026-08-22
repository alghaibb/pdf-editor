"use client"

import { useEffect, useRef } from "react"

import { useEditorStore } from "@/stores/editor-store"

// Edits arrive in bursts (a content box blur, an annotation drop), so a
// short idle window batches them into one save without feeling laggy.
const AUTOSAVE_IDLE_MS = 4_000
// When a save is already in flight, check back soon instead of dropping
// the pending edits until the next manual save.
const AUTOSAVE_RETRY_MS = 2_000

/**
 * Saves automatically once the document has sat dirty and idle for a few
 * seconds. Skipped while a save failure is showing so a broken endpoint is
 * not hammered; the next manual save clears the failure and re-arms it.
 */
export function useAutosave(onAutosave: () => void) {
  const onAutosaveRef = useRef(onAutosave)

  useEffect(() => {
    onAutosaveRef.current = onAutosave
  })

  useEffect(() => {
    let timer: number | undefined

    const attempt = () => {
      const state = useEditorStore.getState()

      if (!state.isReady || !state.isDirty || state.errorMessage) {
        return
      }

      if (state.isSaving || state.isFinalizing || state.isDownloading) {
        timer = window.setTimeout(attempt, AUTOSAVE_RETRY_MS)
        return
      }

      onAutosaveRef.current()
    }

    let lastEpoch = useEditorStore.getState().dirtyEpoch

    const unsubscribe = useEditorStore.subscribe((state) => {
      if (state.dirtyEpoch === lastEpoch) {
        return
      }

      lastEpoch = state.dirtyEpoch
      window.clearTimeout(timer)
      timer = window.setTimeout(attempt, AUTOSAVE_IDLE_MS)
    })

    return () => {
      window.clearTimeout(timer)
      unsubscribe()
    }
  }, [])
}
