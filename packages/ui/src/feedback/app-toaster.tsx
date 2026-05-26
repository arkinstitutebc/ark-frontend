import { CircleAlert, CircleCheck, Info, X } from "lucide-solid"
import { createSignal, For } from "solid-js"
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
  const Icon =
    props.item.variant === "success"
      ? CircleCheck
      : props.item.variant === "error"
        ? CircleAlert
        : Info

  return (
    <div
      class="animate-toast-in pointer-events-auto grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 font-sans text-foreground shadow-[0_10px_28px_rgba(15,23,42,0.10),0_1px_2px_rgba(15,23,42,0.05)]"
      style={{
        width: "min(calc(100vw - 2rem), 22rem)",
      }}
      role={props.item.variant === "error" ? "alert" : "status"}
    >
      <span class="mt-0.5 text-muted" aria-hidden="true">
        <Icon class="h-4 w-4" />
      </span>
      <p class="min-w-0 break-words text-[13px] font-medium leading-5 tracking-normal">
        {props.item.message}
      </p>
      <button
        type="button"
        onClick={() => dismiss(props.item.id)}
        class="-mr-1 -mt-1 flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        aria-label="Dismiss"
      >
        <X class="h-3.5 w-3.5" />
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
      <div class="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2">
        <For each={items()}>{item => <ToastCard item={item} />}</For>
      </div>
    </Portal>
  )
}
