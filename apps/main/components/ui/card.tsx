import type { JSX } from "solid-js"
import { cn } from "@/lib/utils"

export function Card(props: { class?: string; children: JSX.Element }) {
  return (
    <div
      class={cn(
        "bg-white rounded-lg shadow-lg border border-gray-100 hover:shadow-xl transition-shadow",
        props.class
      )}
    >
      {props.children}
    </div>
  )
}
