import { toast } from "@ark/ui"
import { api } from "@data/api"
import { createSignal, onMount } from "solid-js"

interface SignatureResponse {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
}

export function SignaturePad(props: { onUploaded: (url: string) => void }) {
  let canvas!: HTMLCanvasElement
  const [drawing, setDrawing] = createSignal(false)
  const [uploading, setUploading] = createSignal(false)

  onMount(() => {
    const context = canvas.getContext("2d")
    if (!context) return
    context.lineWidth = 2
    context.lineCap = "round"
    context.strokeStyle = "#111827"
  })

  const point = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
      y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
    }
  }

  const start = (event: PointerEvent) => {
    const context = canvas.getContext("2d")
    if (!context) return
    canvas.setPointerCapture(event.pointerId)
    const current = point(event)
    context.beginPath()
    context.moveTo(current.x, current.y)
    setDrawing(true)
  }

  const move = (event: PointerEvent) => {
    if (!drawing()) return
    const context = canvas.getContext("2d")
    if (!context) return
    const current = point(event)
    context.lineTo(current.x, current.y)
    context.stroke()
  }

  const clear = () => canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height)

  const upload = async () => {
    setUploading(true)
    try {
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          value => (value ? resolve(value) : reject(new Error("Could not capture signature"))),
          "image/png"
        )
      )
      const sig = await api<SignatureResponse>("/api/procurement/upload-signature/attachment", {
        method: "POST",
      })
      const form = new FormData()
      form.append(
        "file",
        new File([blob], `recipient-signature-${Date.now()}.png`, { type: "image/png" })
      )
      form.append("api_key", sig.apiKey)
      form.append("timestamp", String(sig.timestamp))
      form.append("signature", sig.signature)
      form.append("folder", sig.folder)
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        {
          method: "POST",
          body: form,
        }
      )
      if (!response.ok) throw new Error("Signature upload failed")
      const result = (await response.json()) as { secure_url: string }
      props.onUploaded(result.secure_url)
      toast.success("Signature captured")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Signature upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div class="space-y-2">
      <canvas
        ref={canvas}
        width={700}
        height={220}
        class="h-36 w-full touch-none rounded-lg border border-border bg-white"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={() => setDrawing(false)}
        onPointerCancel={() => setDrawing(false)}
        aria-label="Recipient signature pad"
      />
      <div class="flex justify-end gap-2">
        <button
          type="button"
          onClick={clear}
          class="rounded-lg border border-border px-3 py-1.5 text-xs"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={upload}
          disabled={uploading()}
          class="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {uploading() ? "Saving…" : "Use Signature"}
        </button>
      </div>
    </div>
  )
}
