"use client"

import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingButton } from "@/components/ui/loading-button"

const SIGN_METHODS = [
  { id: "draw", label: "Draw" },
  { id: "type", label: "Type" },
  { id: "image", label: "Image" },
] as const

type SignMethod = (typeof SIGN_METHODS)[number]["id"]

type SignDocumentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: (imageDataUrl: string) => Promise<void>
}

export function SignDocumentDialog({
  open,
  onOpenChange,
  onApply,
}: SignDocumentDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isDrawingRef = useRef(false)
  const [method, setMethod] = useState<SignMethod>("draw")
  const [typedName, setTypedName] = useState("")
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [imageName, setImageName] = useState<string | null>(null)
  const [hasInk, setHasInk] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    window.requestAnimationFrame(() => clearDrawCanvas(canvasRef.current))
  }, [open])

  function pointerPosition(
    canvas: HTMLCanvasElement,
    event: React.PointerEvent<HTMLCanvasElement>
  ) {
    const bounds = canvas.getBoundingClientRect()
    const scaleX = canvas.width / bounds.width
    const scaleY = canvas.height / bounds.height

    return {
      x: (event.clientX - bounds.left) * scaleX,
      y: (event.clientY - bounds.top) * scaleY,
    }
  }

  function startDraw(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")

    if (!canvas || !context) {
      return
    }

    isDrawingRef.current = true
    canvas.setPointerCapture(event.pointerId)
    const point = pointerPosition(canvas, event)
    context.beginPath()
    context.moveTo(point.x, point.y)
  }

  function moveDraw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) {
      return
    }

    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")

    if (!canvas || !context) {
      return
    }

    const point = pointerPosition(canvas, event)
    context.lineTo(point.x, point.y)
    context.stroke()
    setHasInk(true)
  }

  function endDraw() {
    isDrawingRef.current = false
  }

  function clearDraw() {
    clearDrawCanvas(canvasRef.current)
    setHasInk(false)
  }

  function onPickImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageDataUrl(reader.result)
        setImageName(file.name)
      }
    }

    reader.onerror = () => {
      console.error("Failed to read signature image:", reader.error)
    }

    reader.readAsDataURL(file)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setMethod("draw")
      setTypedName("")
      setImageDataUrl(null)
      setImageName(null)
      setHasInk(false)
      setIsApplying(false)
    }

    onOpenChange(nextOpen)
  }

  async function handleApply() {
    try {
      setIsApplying(true)

      const dataUrl = createSignatureDataUrl({
        method,
        canvas: canvasRef.current,
        typedName,
        imageDataUrl,
      })

      await onApply(dataUrl)
      handleOpenChange(false)
    } catch (error) {
      console.error("Failed to apply signature:", error)
      throw error
    } finally {
      setIsApplying(false)
    }
  }

  const canApply =
    (method === "draw" && hasInk) ||
    (method === "type" && typedName.trim().length > 0) ||
    (method === "image" && imageDataUrl !== null)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Sign this document</DialogTitle>
          <DialogDescription>
            Draw, type, or upload a signature. Then click the page to place it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-1">
          {SIGN_METHODS.map((entry) => (
            <Button
              key={entry.id}
              type="button"
              variant={method === entry.id ? "default" : "outline"}
              size="sm"
              onClick={() => setMethod(entry.id)}
            >
              {entry.label}
            </Button>
          ))}
        </div>
        {method === "draw" ? (
          <div className="flex flex-col gap-2">
            <canvas
              ref={canvasRef}
              width={640}
              height={220}
              className="h-40 w-full touch-none border border-border bg-background"
              onPointerDown={startDraw}
              onPointerMove={moveDraw}
              onPointerUp={endDraw}
              onPointerLeave={endDraw}
            />
            <Button type="button" variant="ghost" size="sm" onClick={clearDraw}>
              Clear
            </Button>
          </div>
        ) : null}
        {method === "type" ? (
          <input
            autoFocus
            value={typedName}
            onChange={(event) => setTypedName(event.target.value)}
            placeholder="Your name"
            aria-label="Typed signature"
            autoComplete="name"
            className="min-h-24 w-full border border-border bg-background px-4 py-3 text-4xl text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring"
            style={{ fontFamily: '"Segoe Script", "Apple Chancery", cursive' }}
          />
        ) : null}
        {method === "image" ? (
          <div className="flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
              className="sr-only"
              tabIndex={-1}
              onChange={onPickImage}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose image
              </Button>
              <p className="text-sm text-muted-foreground">
                {imageName ?? "PNG or JPEG works best."}
              </p>
            </div>
            {imageDataUrl ? (
              // The file is chosen in this browser by the signer.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageDataUrl}
                alt="Signature preview"
                className="max-h-32 w-full border border-border bg-background object-contain"
              />
            ) : null}
          </div>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <LoadingButton
            type="button"
            disabled={!canApply}
            loading={isApplying}
            loadingText="Applying..."
            onClick={() => void handleApply().catch(() => undefined)}
          >
            Use signature
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function clearDrawCanvas(canvas: HTMLCanvasElement | null) {
  const context = canvas?.getContext("2d")

  if (!canvas || !context) {
    return
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.lineWidth = 3
  context.lineCap = "round"
  context.lineJoin = "round"
  context.strokeStyle = "#111111"
}

function createSignatureDataUrl({
  method,
  canvas,
  typedName,
  imageDataUrl,
}: {
  method: SignMethod
  canvas: HTMLCanvasElement | null
  typedName: string
  imageDataUrl: string | null
}) {
  if (method === "draw") {
    if (!canvas) {
      throw new Error("Draw a signature first.")
    }

    return canvas.toDataURL("image/png")
  }

  if (method === "image") {
    if (!imageDataUrl) {
      throw new Error("Choose a signature image first.")
    }

    return imageDataUrl
  }

  const text = typedName.trim()

  if (!text) {
    throw new Error("Type a signature first.")
  }

  const output = document.createElement("canvas")
  const context = output.getContext("2d")

  if (!context) {
    throw new Error("This browser cannot create a typed signature.")
  }

  const fontSize = 64
  const font = `${fontSize}px "Segoe Script", "Apple Chancery", cursive`
  context.font = font
  const width = Math.ceil(context.measureText(text).width) + 32
  const height = fontSize + 40
  output.width = width
  output.height = height
  context.font = font
  context.fillStyle = "#111111"
  context.textBaseline = "middle"
  context.fillText(text, 16, height / 2)

  return output.toDataURL("image/png")
}
