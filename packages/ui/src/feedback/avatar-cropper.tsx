import { createEffect, createSignal, onCleanup, Show } from "solid-js"
import { Button } from "../forms/button"
import { Icons } from "../icons"
import { Modal } from "./modal"

const FRAME_SIZE = 280 // CSS pixels — diameter of the visible circular frame
const MAX_ZOOM = 4

export interface AvatarCropperProps {
  /** Source file selected by the user. The modal opens when this is non-null. */
  file: File | null
  /** Called with the cropped circular avatar as a square Blob (256×256 PNG). */
  onCropped: (blob: Blob) => void
  /** Called when the user closes/cancels without confirming. */
  onCancel: () => void
  /** Output square edge size in pixels (the result is square but rendered as a circle). Default 256. */
  outputSize?: number
}

/**
 * Avatar cropper modal — drag + zoom inside a circular frame; outputs a square
 * PNG that the consumer (CSS rounded-full) renders as a circle.
 *
 * Design choices:
 *   - No external deps. Pure SolidJS + Canvas2D.
 *   - The cropped image is a **square** PNG (the circle is purely visual via
 *     CSS clip / rounded-full). Saves storage vs an alpha-cut mask, looks the
 *     same in every consumer that already renders avatars as circles.
 *   - Pointer events (not mouse/touch) — works on desktop + tablet trackpad +
 *     mobile touch with one branch.
 *   - Image positioning is in display pixels relative to the frame center; the
 *     final draw inverts position+zoom to compute source coords on the
 *     full-resolution image.
 */
export function AvatarCropper(props: AvatarCropperProps) {
  const [imgSrc, setImgSrc] = createSignal<string | null>(null)
  const [imgLoaded, setImgLoaded] = createSignal(false)
  const [zoom, setZoom] = createSignal(1)
  const [minZoom, setMinZoom] = createSignal(1)
  const [position, setPosition] = createSignal({ x: 0, y: 0 })
  const [busy, setBusy] = createSignal(false)
  let imgEl: HTMLImageElement | undefined
  let dragStart: { x: number; y: number; posX: number; posY: number } | null = null

  // ── Load file → object URL → image element ─────────────────────────────
  createEffect(() => {
    const f = props.file
    if (!f) {
      setImgSrc(null)
      setImgLoaded(false)
      return
    }
    const url = URL.createObjectURL(f)
    setImgSrc(url)
    setImgLoaded(false)
    setZoom(1)
    setMinZoom(1)
    setPosition({ x: 0, y: 0 })
    onCleanup(() => URL.revokeObjectURL(url))
  })

  function onImgLoad() {
    setImgLoaded(true)
    // Auto-fit: scale image so its smaller dimension equals the frame.
    if (imgEl) {
      const fit = FRAME_SIZE / Math.min(imgEl.naturalWidth, imgEl.naturalHeight)
      const floor = Math.min(1, fit)
      setMinZoom(floor)
      setZoom(fit)
    }
  }

  function clampZoom(next: number) {
    return Math.min(MAX_ZOOM, Math.max(minZoom(), next))
  }

  function updateZoom(next: number) {
    setZoom(clampZoom(next))
  }

  function resetCrop() {
    if (!imgEl) return
    const fit = FRAME_SIZE / Math.min(imgEl.naturalWidth, imgEl.naturalHeight)
    const floor = Math.min(1, fit)
    setMinZoom(floor)
    setZoom(fit)
    setPosition({ x: 0, y: 0 })
  }

  // ── Pointer drag ──────────────────────────────────────────────────────
  function onPointerDown(e: PointerEvent) {
    if (!imgLoaded()) return
    e.preventDefault()
    dragStart = { x: e.clientX, y: e.clientY, posX: position().x, posY: position().y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragStart) return
    setPosition({
      x: dragStart.posX + (e.clientX - dragStart.x),
      y: dragStart.posY + (e.clientY - dragStart.y),
    })
  }
  function onPointerUp(e: PointerEvent) {
    dragStart = null
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }

  function onWheel(e: WheelEvent) {
    if (!imgLoaded()) return
    e.preventDefault()
    const direction = e.deltaY > 0 ? -1 : 1
    updateZoom(zoom() + direction * 0.08)
  }

  // ── Confirm: render to canvas, emit Blob ──────────────────────────────
  async function handleConfirm() {
    if (!imgEl || !imgLoaded()) return
    setBusy(true)
    const out = props.outputSize ?? 256
    const canvas = document.createElement("canvas")
    canvas.width = out
    canvas.height = out
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      setBusy(false)
      return
    }

    const z = zoom()
    const naturalW = imgEl.naturalWidth
    const naturalH = imgEl.naturalHeight
    // The frame's center maps to image natural-coords:
    //   imageCenterDisplay = frameCenter + position
    //   ⇒ offset from natural image center (in display px) = (-position.x, -position.y)
    //   ⇒ in natural px = (-position.x / z, -position.y / z)
    // Crop window edge in natural px = FRAME_SIZE / z
    const cropSize = FRAME_SIZE / z
    const sx = naturalW / 2 - position().x / z - cropSize / 2
    const sy = naturalH / 2 - position().y / z - cropSize / 2

    // Fill bg in case crop extends past image bounds (transparent PNG would otherwise
    // show as a black square in some viewers).
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, out, out)
    ctx.drawImage(imgEl, sx, sy, cropSize, cropSize, 0, 0, out, out)

    canvas.toBlob(
      blob => {
        setBusy(false)
        if (blob) props.onCropped(blob)
      },
      "image/png",
      0.92
    )
  }

  return (
    <Modal open={!!props.file} onClose={props.onCancel} title="Adjust profile photo" size="xl">
      <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div class="rounded-2xl border border-border bg-surface-muted/40 p-4">
          <div class="mb-4 flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-foreground">Crop preview</p>
              <p class="mt-1 text-xs text-muted">
                Drag the image, scroll or use controls to zoom, then save the crop.
              </p>
            </div>
            <button
              type="button"
              onClick={resetCrop}
              disabled={!imgLoaded() || busy()}
              class="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted disabled:opacity-50"
            >
              Reset
            </button>
          </div>
          <div
            class="relative mx-auto overflow-hidden rounded-full border-4 border-surface bg-surface shadow-inner ring-1 ring-border touch-none select-none cursor-move"
            style={{
              width: `${FRAME_SIZE}px`,
              height: `${FRAME_SIZE}px`,
              "user-select": "none",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
          >
            <Show when={imgSrc()}>
              {src => (
                <img
                  ref={imgEl}
                  src={src()}
                  alt=""
                  draggable={false}
                  onLoad={onImgLoad}
                  class="absolute pointer-events-none"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: `translate(calc(-50% + ${position().x}px), calc(-50% + ${position().y}px)) scale(${zoom()})`,
                    "transform-origin": "center center",
                    "max-width": "none",
                  }}
                />
              )}
            </Show>
          </div>
        </div>

        <div class="flex flex-col justify-between gap-5">
          <div class="space-y-4">
            <div class="rounded-xl border border-border bg-surface p-4">
              <div class="mb-3 flex items-center justify-between">
                <span class="text-sm font-semibold text-foreground">Zoom</span>
                <span class="text-xs text-muted tabular-nums">{zoom().toFixed(2)}x</span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateZoom(zoom() - 0.1)}
                  disabled={!imgLoaded() || zoom() <= minZoom() || busy()}
                  class="rounded-lg border border-border p-2 text-muted transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
                  aria-label="Zoom out"
                >
                  <Icons.minus class="h-4 w-4" />
                </button>
                <input
                  type="range"
                  min={minZoom()}
                  max={MAX_ZOOM}
                  step={0.01}
                  value={zoom()}
                  onInput={e => updateZoom(Number.parseFloat(e.currentTarget.value))}
                  class="min-w-0 flex-1 accent-primary"
                  aria-label="Zoom"
                />
                <button
                  type="button"
                  onClick={() => updateZoom(zoom() + 0.1)}
                  disabled={!imgLoaded() || zoom() >= MAX_ZOOM || busy()}
                  class="rounded-lg border border-border p-2 text-muted transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
                  aria-label="Zoom in"
                >
                  <Icons.plus class="h-4 w-4" />
                </button>
              </div>
              <p class="mt-3 text-xs text-muted">
                Zoom out to fit more of the original image, then drag to center the face.
              </p>
            </div>

            <div class="rounded-xl border border-border bg-surface p-4">
              <p class="text-sm font-semibold text-foreground">Output</p>
              <p class="mt-1 text-xs text-muted">
                Saved as a square PNG and displayed as a circle in the portal.
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={props.onCancel}
              disabled={busy()}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirm}
              disabled={!imgLoaded() || busy()}
            >
              {busy() ? "Processing..." : "Use this photo"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
