import { toast as rawToast, Toaster } from "solid-toast"

const baseStyle = {
  "font-size": "13px",
  "font-family": "Montserrat, sans-serif",
  "font-weight": "500",
  background: "var(--color-surface)",
  color: "var(--color-foreground)",
  border: "1px solid var(--color-border)",
  "box-shadow": "0 2px 8px rgba(0, 0, 0, 0.06)",
  "border-radius": "8px",
  padding: "8px 12px",
} as const

const successAccent = {
  "border-left": "3px solid var(--color-primary)",
} as const

const errorAccent = {
  "border-left": "3px solid var(--color-accent)",
} as const

type ToastFn<K extends "success" | "error"> = (typeof rawToast)[K]

// Wrap success/error to apply design-system accent borders without changing
// the call API. All other methods on `toast` (loading, custom, dismiss, …)
// are forwarded through.
const wrappedSuccess: ToastFn<"success"> = ((message, opts) =>
  rawToast.success(message, {
    ...opts,
    style: { ...successAccent, ...(opts?.style ?? {}) },
  })) as ToastFn<"success">

const wrappedError: ToastFn<"error"> = ((message, opts) =>
  rawToast.error(message, {
    ...opts,
    style: { ...errorAccent, ...(opts?.style ?? {}) },
  })) as ToastFn<"error">

const callable = ((message, opts) => rawToast(message, opts)) as typeof rawToast
export const toast = Object.assign(callable, rawToast, {
  success: wrappedSuccess,
  error: wrappedError,
}) as typeof rawToast

/**
 * Pre-themed Toaster wrapper for all 7 portals.
 *
 * Uses CSS variables (`--color-surface`, `--color-foreground`, `--color-border`,
 * `--color-primary`, `--color-accent`) so toasts automatically theme correctly
 * in both light and dark modes. Success and error toasts get a 3px colored
 * left-border accent via the wrapped `toast` export above.
 */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={6}
      toastOptions={{
        duration: 3000,
        style: baseStyle,
      }}
    />
  )
}
