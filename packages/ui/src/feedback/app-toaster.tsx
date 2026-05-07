import { CheckCircle, X, XCircle } from "lucide-solid"
import { Show } from "solid-js"
import { toast as rawToast, type Toast, Toaster } from "solid-toast"

type Variant = "success" | "error" | "info"

interface CustomToastProps {
  t: Toast
  variant: Variant
  message: string
}

function CustomToast(props: CustomToastProps) {
  const accent = () =>
    props.variant === "success"
      ? "var(--color-primary)"
      : props.variant === "error"
        ? "var(--color-accent)"
        : "var(--color-border)"

  return (
    <div
      class="flex items-start gap-2.5 bg-surface text-foreground rounded-lg pl-3 pr-2.5 py-2.5 transition-opacity"
      style={{
        "min-width": "260px",
        "max-width": "380px",
        border: "1px solid var(--color-border)",
        "border-left": `3px solid ${accent()}`,
        "box-shadow": "0 2px 6px rgba(0, 0, 0, 0.06)",
        "font-family": "Montserrat, sans-serif",
        opacity: props.t.visible ? "1" : "0",
      }}
    >
      <Show when={props.variant === "success"}>
        <CheckCircle class="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accent() }} />
      </Show>
      <Show when={props.variant === "error"}>
        <XCircle class="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accent() }} />
      </Show>
      <p class="flex-1 text-[13px] leading-snug font-medium pt-px">{props.message}</p>
      <button
        type="button"
        onClick={() => rawToast.dismiss(props.t.id)}
        class="text-muted hover:text-foreground transition-colors -mr-0.5 mt-0.5"
        aria-label="Dismiss"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// Public toast API that mirrors solid-toast's surface but always renders
// the design-system CustomToast above. Other methods (loading, custom,
// dismiss, …) pass through to solid-toast unchanged.
const success = (message: string) =>
  rawToast.custom(t => <CustomToast t={t} variant="success" message={message} />, {
    duration: 3000,
  })

const error = (message: string) =>
  rawToast.custom(t => <CustomToast t={t} variant="error" message={message} />, {
    duration: 4000,
  })

const callable = ((message: string) =>
  rawToast.custom(t => <CustomToast t={t} variant="info" message={message} />, {
    duration: 3000,
  })) as typeof rawToast

export const toast = Object.assign(callable, rawToast, { success, error }) as typeof rawToast

/**
 * Pre-themed Toaster wrapper for all 7 portals. Renders fully custom toast
 * cards (see `CustomToast`) so we own every pixel — no solid-toast default
 * styling leaks through. Place once near the top of each portal's `+Layout.tsx`.
 */
export function AppToaster() {
  return <Toaster position="top-right" gutter={8} />
}
