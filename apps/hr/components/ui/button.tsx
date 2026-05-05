import { cn } from "@/lib/utils"

export interface ButtonProps {
  variant?: "primary" | "accent" | "secondary" | "ghost"
  size?: "sm" | "md" | "lg"
  children: import("solid-js").JSX.Element
  class?: string
  disabled?: boolean
  onClick?: () => void
  type?: "button" | "submit"
}

export function Button(props: ButtonProps) {
  const size = props.size || "md"
  const variant = props.variant || "primary"

  let sizeClass = ""
  let variantClass = ""

  switch (size) {
    case "sm":
      sizeClass = "px-4 py-2 text-sm"
      break
    case "md":
      sizeClass = "px-6 py-3 text-base"
      break
    case "lg":
      sizeClass = "px-8 py-4 text-lg"
      break
    default:
      sizeClass = "px-6 py-3 text-base"
  }

  switch (variant) {
    case "primary":
      variantClass = "bg-primary text-white shadow-glow-primary hover:opacity-90 hover:shadow-lg"
      break
    case "accent":
      variantClass = "bg-accent text-white shadow-glow-accent hover:opacity-90 hover:shadow-lg"
      break
    case "secondary":
      variantClass =
        "bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white"
      break
    case "ghost":
      variantClass = "bg-transparent text-gray-600 hover:bg-gray-100"
      break
    default:
      variantClass = "bg-primary text-white shadow-glow-primary hover:opacity-90 hover:shadow-lg"
  }

  return (
    <button
      type={props.type || "button"}
      {...props}
      class={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClass,
        variantClass,
        props.class
      )}
    >
      {props.children}
    </button>
  )
}
