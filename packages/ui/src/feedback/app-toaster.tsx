import { CheckCircle, X, XCircle } from "lucide-solid"
import { createSignal, For, Show } from "solid-js"
import { Portal } from "solid-js/web"

/**
 * In-house toast system. Zero external deps — Solid signals + a Portal.
 * The previous solid-toast wrapper had a parent container with hard-coded
 * paddings/sizing we couldn't fully theme. This owns every pixel.
 *
 * Public surface mirrors what the codebase actually calls:
 *   - `toast.success(msg)`
 *   - `toast.error(msg)`
 *   - `toast.info(msg)`
 *   - `toast.dismiss(id)`
 */

type Variant = "success" | "error" | "info"

interface ToastItem {
  id: number
  variant: Variant
  message: string
}

const [items, setItems] = createSignal<ToastItem[]>([])
let nextId = 1

function dismiss(id: number) {
  setItems(prev => prev.filter(t => t.id !== id))
}

function show(variant: Variant, message: string, durationMs: number) {
  const id = nextId++
  setItems(prev => [...prev, { id, variant, message }])
  if (durationMs > 0) {
    setTimeout(() => dismiss(id), durationMs)
  }
  return id
}

export const toast = {
  success: (message: string) => show("success", message, 3000),
  error: (message: string) => show("error", message, 4500),
  info: (message: string) => show("info", message, 3000),
  dismiss,
}

interface ToastCardProps {
  item: ToastItem
}

function ToastCard(props: ToastCardProps) {
  const accent = () =>
    props.item.variant === "success"
      ? "var(--color-primary)"
      : props.item.variant === "error"
        ? "var(--color-accent)"
        : "var(--color-border)"

  return (
    <div
      class="animate-toast-in pointer-events-auto flex items-start gap-3 bg-surface text-foreground rounded-xl px-4 py-3.5"
      style={{
        "min-width": "320px",
        "max-width": "440px",
        border: "1px solid var(--color-border)",
        "border-left": `4px solid ${accent()}`,
        "box-shadow": "0 8px 24px rgba(0, 0, 0, 0.12)",
        "font-family": "Montserrat, sans-serif",
      }}
      role={props.item.variant === "error" ? "alert" : "status"}
    >
      <Show when={props.item.variant === "success"}>
        <CheckCircle class="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: accent() }} />
      </Show>
      <Show when={props.item.variant === "error"}>
        <XCircle class="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: accent() }} />
      </Show>
      <p class="flex-1 text-sm leading-snug font-medium pt-0.5">{props.item.message}</p>
      <button
        type="button"
        onClick={() => dismiss(props.item.id)}
        class="text-muted hover:text-foreground transition-colors -mr-1 flex-shrink-0"
        aria-label="Dismiss"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  )
}

/**
 * Mount once near the top of each portal's `+Layout.tsx`. Renders into a
 * Portal so it's not constrained by ancestor `overflow: hidden`.
 */
export function AppToaster() {
  return (
    <Portal>
      <div class="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        <For each={items()}>{item => <ToastCard item={item} />}</For>
      </div>
    </Portal>
  )
}
