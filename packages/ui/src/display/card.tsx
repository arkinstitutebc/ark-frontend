import { cn } from "../utils"

export interface CardProps {
  children: import("solid-js").JSX.Element
  class?: string
}

export function Card(props: CardProps) {
  return (
    <div
      class={cn(
        "bg-surface rounded-lg shadow-lg border border-border hover:shadow-xl transition-shadow",
        props.class
      )}
    >
      {props.children}
    </div>
  )
}
