"use client"

import { useEffect, useRef } from "react"

import { handleSaveShortcutEvent } from "../_lib/editor-utils"

type EditorKeyboardShortcuts = {
  onSave: () => void
}

/**
 * Window-level shortcuts. Keystrokes inside the WebViewer iframe are handled
 * separately in useWebViewer because iframe events do not reach this window.
 */
export function useEditorKeyboardShortcuts({
  onSave,
}: EditorKeyboardShortcuts) {
  const onSaveRef = useRef(onSave)

  useEffect(() => {
    onSaveRef.current = onSave
  })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      handleSaveShortcutEvent(event, () => onSaveRef.current())
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])
}
