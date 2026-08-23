"use client"

import { useEffect, useRef } from "react"

import {
  handleHistoryShortcutEvent,
  handleSaveShortcutEvent,
} from "../_lib/editor-utils"

type EditorKeyboardShortcuts = {
  onSave: () => void
  onUndo: () => void
  onRedo: () => void
}

/**
 * Window-level shortcuts. Keystrokes inside the WebViewer iframe are handled
 * separately in useWebViewer because iframe events do not reach this window.
 */
export function useEditorKeyboardShortcuts({
  onSave,
  onUndo,
  onRedo,
}: EditorKeyboardShortcuts) {
  const onSaveRef = useRef(onSave)
  const onUndoRef = useRef(onUndo)
  const onRedoRef = useRef(onRedo)

  useEffect(() => {
    onSaveRef.current = onSave
    onUndoRef.current = onUndo
    onRedoRef.current = onRedo
  })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      handleSaveShortcutEvent(event, () => onSaveRef.current())
      handleHistoryShortcutEvent(
        event,
        () => onUndoRef.current(),
        () => onRedoRef.current()
      )
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])
}
