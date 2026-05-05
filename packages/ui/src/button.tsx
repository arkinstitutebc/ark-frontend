import type { JSX } from "solid-js"
import { cn } from "./utils"

export function Button(
  props: JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "accent" | "secondary" | "ghost"
    size?: "sm" | "md" | "lg"
  }
) {
  const size = props.size || "md"
  const variant = props.variant || "primary"

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  }[size]

  const variantClasses = {
    primary: "bg-primary text-white shadow-glow-primary hover:opacity-90 hover:shadow-lg",
    accent: "bg-accent text-white shadow-glow-accent hover:opacity-90 hover:shadow-lg",
    secondary: "bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
  }[variant]

  return (
    <button
      {...props}
      class={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClasses,
        variantClasses,
        props.class
      )}
    >
      {props.children}
    </button>
  )
}
