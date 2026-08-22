import { create } from "zustand"

export type EditorSaveStatus = "saved" | "unsaved" | "saving" | "failed"

type EditorState = {
  documentId: string | null
  fileName: string
  isReady: boolean
  isDirty: boolean
  isSaving: boolean
  /**
   * True while a save's server-side finalization (verify + promote +
   * version record) runs after the bytes already reached storage. The next
   * version number depends on it, so another save must not start until it
   * settles.
   */
  isFinalizing: boolean
  isDownloading: boolean
  /**
   * Incremented on every edit. A save snapshots the epoch before exporting
   * so it can tell whether edits arrived while it was in flight and keep
   * the document dirty instead of wrongly marking those edits saved.
   */
  dirtyEpoch: number
  saveStatus: EditorSaveStatus
  errorMessage: string | null
  /**
   * Informational message that does not affect save state, e.g. a scanned
   * PDF without a text layer. setError is the wrong channel for these
   * because it flips the save status to failed.
   */
  noticeMessage: string | null
  setDocument: (documentId: string, fileName: string) => void
  setReady: (isReady: boolean) => void
  markDirty: () => void
  markSaved: (savedEpoch?: number) => void
  setSaving: (isSaving: boolean) => void
  setFinalizing: (isFinalizing: boolean) => void
  setDownloading: (isDownloading: boolean) => void
  setError: (message: string | null) => void
  setNotice: (message: string | null) => void
  reset: () => void
}

const initialState = {
  documentId: null,
  fileName: "",
  isReady: false,
  isDirty: false,
  isSaving: false,
  isFinalizing: false,
  isDownloading: false,
  dirtyEpoch: 0,
  saveStatus: "saved" as const,
  errorMessage: null,
  noticeMessage: null,
}

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,
  setDocument: (documentId, fileName) => set({ documentId, fileName }),
  setReady: (isReady) => set({ isReady }),
  markDirty: () =>
    set((state) => ({
      isDirty: true,
      dirtyEpoch: state.dirtyEpoch + 1,
      // Keep "Saving..." visible while a save is in flight; markSaved sees
      // the epoch change afterwards and flips the status to unsaved.
      saveStatus: state.isSaving ? state.saveStatus : "unsaved",
    })),
  markSaved: (savedEpoch) =>
    set((state) => {
      // Edits arrived while the save was exporting/uploading; the stored
      // file does not contain them, so the document must stay unsaved.
      if (savedEpoch !== undefined && savedEpoch !== state.dirtyEpoch) {
        return { isSaving: false, saveStatus: "unsaved" as const }
      }

      return {
        isDirty: false,
        isSaving: false,
        saveStatus: "saved" as const,
        errorMessage: null,
      }
    }),
  setSaving: (isSaving) =>
    set((state) => ({
      isSaving,
      saveStatus: isSaving ? "saving" : "unsaved",
      // A fresh save attempt supersedes any earlier failure message.
      errorMessage: isSaving ? null : state.errorMessage,
    })),
  setFinalizing: (isFinalizing) => set({ isFinalizing }),
  setDownloading: (isDownloading) => set({ isDownloading }),
  setError: (errorMessage) =>
    set({
      errorMessage,
      saveStatus: errorMessage ? "failed" : "unsaved",
      isSaving: false,
    }),
  setNotice: (noticeMessage) => set({ noticeMessage }),
  reset: () => set(initialState),
}))
