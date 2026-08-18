import { create } from "zustand"

export type EditorSaveStatus = "saved" | "unsaved" | "exporting" | "failed"

type EditorState = {
  fileName: string
  isReady: boolean
  isDirty: boolean
  isExporting: boolean
  saveStatus: EditorSaveStatus
  errorMessage: string | null
  setFileName: (fileName: string) => void
  setReady: (isReady: boolean) => void
  markDirty: () => void
  markSaved: () => void
  setExporting: (isExporting: boolean) => void
  setError: (message: string | null) => void
  reset: () => void
}

const initialState = {
  fileName: "sample-invoice.pdf",
  isReady: false,
  isDirty: false,
  isExporting: false,
  saveStatus: "saved" as const,
  errorMessage: null,
}

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,
  setFileName: (fileName) => set({ fileName }),
  setReady: (isReady) => set({ isReady }),
  markDirty: () => set({ isDirty: true, saveStatus: "unsaved" }),
  markSaved: () =>
    set({ isDirty: false, saveStatus: "saved", isExporting: false }),
  setExporting: (isExporting) =>
    set({
      isExporting,
      saveStatus: isExporting ? "exporting" : "unsaved",
    }),
  setError: (errorMessage) =>
    set({
      errorMessage,
      saveStatus: errorMessage ? "failed" : "unsaved",
      isExporting: false,
    }),
  reset: () => set(initialState),
}))
