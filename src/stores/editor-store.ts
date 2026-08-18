import { create } from "zustand"

export type EditorSaveStatus = "saved" | "unsaved" | "saving" | "failed"

type EditorState = {
  documentId: string | null
  fileName: string
  isReady: boolean
  isDirty: boolean
  isSaving: boolean
  saveStatus: EditorSaveStatus
  errorMessage: string | null
  setDocument: (documentId: string, fileName: string) => void
  setReady: (isReady: boolean) => void
  markDirty: () => void
  markSaved: () => void
  setSaving: (isSaving: boolean) => void
  setError: (message: string | null) => void
  reset: () => void
}

const initialState = {
  documentId: null,
  fileName: "",
  isReady: false,
  isDirty: false,
  isSaving: false,
  saveStatus: "saved" as const,
  errorMessage: null,
}

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,
  setDocument: (documentId, fileName) => set({ documentId, fileName }),
  setReady: (isReady) => set({ isReady }),
  markDirty: () => set({ isDirty: true, saveStatus: "unsaved" }),
  markSaved: () =>
    set({ isDirty: false, saveStatus: "saved", isSaving: false }),
  setSaving: (isSaving) =>
    set({
      isSaving,
      saveStatus: isSaving ? "saving" : "unsaved",
    }),
  setError: (errorMessage) =>
    set({
      errorMessage,
      saveStatus: errorMessage ? "failed" : "unsaved",
      isSaving: false,
    }),
  reset: () => set(initialState),
}))
