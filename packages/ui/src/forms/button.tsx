import { type JSX, splitProps } from "solid-js"
import { cn } from "../utils"

export function Button(
  props: JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "accent" | "secondary" | "ghost"
    size?: "sm" | "md" | "lg"
    loading?: boolean
    loadingLabel?: string
  }
) {
  const [local, buttonProps] = splitProps(props, [
    "children",
    "class",
    "disabled",
    "loading",
    "loadingLabel",
    "size",
    "variant",
  ])
  const size = local.size || "md"
  const variant = local.variant || "primary"

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  }[size]

  const variantClasses = {
    primary: "bg-primary text-white shadow-glow-primary hover:opacity-90 hover:shadow-lg",
    accent: "bg-accent text-white shadow-glow-accent hover:opacity-90 hover:shadow-lg",
    secondary: "bg-surface text-primary border-2 border-primary hover:bg-primary hover:text-white",
    ghost: "bg-transparent text-muted hover:bg-surface-muted hover:text-foreground",
  }[variant]

  return (
    <button
      {...buttonProps}
      disabled={local.disabled || local.loading}
      aria-busy={local.loading || undefined}
      class={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClasses,
        variantClasses,
        local.class
      )}
    >
      {local.loading ? <ButtonSpinner /> : null}
      {local.loading && local.loadingLabel ? <span>{local.loadingLabel}</span> : local.children}
    </button>
  )
}

function ButtonSpinner() {
  return (
    <svg
      class="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="img"
      aria-label="Loading"
    >
      <title>Loading</title>
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
