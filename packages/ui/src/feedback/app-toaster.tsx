import { Toaster, toast } from "solid-toast"

export { toast }

/**
 * Pre-themed Toaster wrapper for all 7 portals.
 *
 * Uses CSS variables (`--color-surface`, `--color-foreground`, `--color-border`)
 * so toasts automatically theme correctly in both light and dark modes.
 * Place once near the top of each portal's `+Layout.tsx`.
 */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      toastOptions={{
        duration: 3000,
        style: {
          "font-size": "14px",
          "font-family": "Montserrat, sans-serif",
          background: "var(--color-surface)",
          color: "var(--color-foreground)",
          border: "1px solid var(--color-border)",
          "box-shadow": "0 4px 12px rgba(0, 0, 0, 0.08)",
          "border-radius": "10px",
          padding: "10px 14px",
        },
      }}
    />
  )
}
