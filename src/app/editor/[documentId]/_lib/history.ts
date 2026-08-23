import type { WebViewerInstance } from "@pdftron/webviewer"

type HistoryManager = {
  canUndo?: () => boolean
  canRedo?: () => boolean
  undo?: () => unknown
  redo?: () => unknown
}

type HistoryHost = {
  getAnnotationHistoryManager?: () => HistoryManager
  getContentEditHistoryManager?: () => HistoryManager
}

export function getApryseHistory(instance: WebViewerInstance) {
  const managers = collectHistoryManagers(instance)
  const ui = instance.UI as unknown as {
    undo?: () => unknown
    redo?: () => unknown
  }

  return {
    canUndo() {
      return managers.some((manager) => manager.canUndo?.() === true)
    },
    canRedo() {
      return managers.some((manager) => manager.canRedo?.() === true)
    },
    undo() {
      const manager = managers.find((entry) => entry.canUndo?.() === true)

      if (manager?.undo) {
        return manager.undo()
      }

      return ui.undo?.()
    },
    redo() {
      const manager = managers.find((entry) => entry.canRedo?.() === true)

      if (manager?.redo) {
        return manager.redo()
      }

      return ui.redo?.()
    },
  }
}

function collectHistoryManagers(instance: WebViewerInstance) {
  const hosts: HistoryHost[] = [
    instance.Core.documentViewer as unknown as HistoryHost,
    instance.Core.annotationManager as unknown as HistoryHost,
  ]
  const managers: HistoryManager[] = []

  for (const host of hosts) {
    if (typeof host.getAnnotationHistoryManager === "function") {
      managers.push(host.getAnnotationHistoryManager())
    }

    if (typeof host.getContentEditHistoryManager === "function") {
      managers.push(host.getContentEditHistoryManager())
    }
  }

  return managers
}
