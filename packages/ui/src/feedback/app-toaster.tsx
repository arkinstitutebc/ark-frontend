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

interface ToastOptions {
  durationMs?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastItem {
  id: number
  variant: Variant
  message: string
  action?: ToastOptions["action"]
}

const [items, setItems] = createSignal<ToastItem[]>([])
let nextId = 1
const MAX_TOASTS = 4
const DEFAULT_DURATION: Record<Variant, number> = {
  success: 3000,
  error: 6000,
  info: 3500,
}

function dismiss(id: number) {
  setItems(prev => prev.filter(t => t.id !== id))
}

function show(variant: Variant, message: string, options?: ToastOptions) {
  const id = nextId++
  const durationMs = options?.durationMs ?? DEFAULT_DURATION[variant]
  setItems(prev => [...prev, { id, variant, message, action: options?.action }].slice(-MAX_TOASTS))
  if (durationMs > 0) {
    setTimeout(() => dismiss(id), durationMs)
  }
  return id
}

export const toast = {
  success: (message: string, options?: ToastOptions) => show("success", message, options),
  error: (message: string, options?: ToastOptions) => show("error", message, options),
  info: (message: string, options?: ToastOptions) => show("info", message, options),
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
  const toneClass = () => {
    if (props.item.variant === "success") return "text-green-600 dark:text-green-400"
    if (props.item.variant === "error") return "text-red-600 dark:text-red-400"
    return "text-primary"
  }

  return (
    <div
      class="animate-toast-in pointer-events-auto grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 font-sans text-foreground shadow-[0_10px_28px_rgba(15,23,42,0.10),0_1px_2px_rgba(15,23,42,0.05)]"
      style={{
        width: "min(calc(100vw - 2rem), 22rem)",
      }}
      role={props.item.variant === "error" ? "alert" : "status"}
    >
      <span class={`mt-0.5 ${toneClass()}`} aria-hidden="true">
        <Icon class="h-4 w-4" />
      </span>
      <div class="min-w-0">
        <p class="break-words text-[13px] font-medium leading-5 tracking-normal">
          {props.item.message}
        </p>
        {props.item.action && (
          <button
            type="button"
            onClick={() => {
              props.item.action?.onClick()
              dismiss(props.item.id)
            }}
            class="mt-2 text-xs font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded"
          >
            {props.item.action.label}
          </button>
        )}
      </div>
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
      <div
        class="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2"
        aria-live="polite"
        aria-relevant="additions"
      >
        <For each={items()}>{item => <ToastCard item={item} />}</For>
      </div>
    </Portal>
  )
}
