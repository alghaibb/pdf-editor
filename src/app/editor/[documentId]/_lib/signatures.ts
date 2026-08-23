import type { WebViewerInstance } from "@pdftron/webviewer"

const SIGNATURE_TOOL_NAME = "AnnotationCreateSignature"

type ViewerUi = {
  setToolMode: (mode: string) => void
  closeElements?: (elements: string[]) => void
  setToolbarGroup?: (group: string) => void
}

type SignatureTool = {
  setSigningMode?: (mode: unknown) => void
  setSignature?: (signature: string) => Promise<unknown> | unknown
}

function asViewerUi(ui: WebViewerInstance["UI"]): ViewerUi {
  return ui as unknown as ViewerUi
}

async function waitForDocument(instance: WebViewerInstance) {
  const { documentViewer } = instance.Core
  const startedAt = Date.now()

  while (!documentViewer.getDocument() && Date.now() - startedAt < 3_000) {
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve())
    })
  }

  if (!documentViewer.getDocument()) {
    throw new Error("The document is not ready to sign.")
  }
}

/**
 * Content-edit mode captures clicks meant for placing a signature, so it
 * must end and the PDF page must exist again before the signature tool runs.
 */
export async function enterSignatureMode(instance: WebViewerInstance) {
  const contentEditManager =
    instance.Core.documentViewer.getContentEditManager()

  if (contentEditManager.isInContentEditMode()) {
    contentEditManager.endContentEditMode()
  }

  await waitForDocument(instance)

  const tool = instance.Core.documentViewer.getTool(
    SIGNATURE_TOOL_NAME
  ) as unknown as SignatureTool
  const annotationMode =
    instance.Core.Tools.SignatureCreateTool.SigningModes.ANNOTATION

  tool.setSigningMode?.(annotationMode)

  asViewerUi(instance.UI).setToolMode(SIGNATURE_TOOL_NAME)
}

export async function applySignatureImage(
  instance: WebViewerInstance,
  imageDataUrl: string
) {
  await enterSignatureMode(instance)

  const tool = instance.Core.documentViewer.getTool(
    SIGNATURE_TOOL_NAME
  ) as unknown as SignatureTool

  if (typeof tool.setSignature !== "function") {
    throw new Error("This editor cannot place a signature.")
  }

  await tool.setSignature(imageDataUrl)
}

export async function enterContentEditMode(instance: WebViewerInstance) {
  const { documentViewer, ContentEdit } = instance.Core
  const contentEditManager = documentViewer.getContentEditManager()
  const ui = asViewerUi(instance.UI)

  ui.closeElements?.(["signatureModal"])
  ui.setToolbarGroup?.("toolbarGroup-Edit")

  await ContentEdit.preloadWorker(contentEditManager)
  await contentEditManager.startContentEditMode()
}
