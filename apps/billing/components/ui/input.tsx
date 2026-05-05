import { createUniqueId } from "solid-js"
import { cn } from "@/lib/utils"

export interface InputProps {
  type?: string
  label?: string
  error?: string
  leftIcon?: import("solid-js").JSX.Element
  class?: string
  placeholder?: string
  value?: string
  onInput?: (e: Event & { target: HTMLInputElement }) => void
  disabled?: boolean
  name?: string
  id?: string
}

export function Input(props: InputProps) {
  const fallbackId = createUniqueId()
  const inputId = () => props.id ?? fallbackId
  const hasLeftIcon = () => props.leftIcon !== undefined

  return (
    <div class="flex flex-col gap-2">
      {props.label && (
        <label for={inputId()} class="text-sm font-medium text-gray-700">
          {props.label}
        </label>
      )}
      <div class="relative">
        {hasLeftIcon() && (
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {props.leftIcon}
          </div>
        )}
        <input
          {...props}
          id={inputId()}
          class={cn(
            "block w-full py-2.5 border rounded-lg text-gray-900 placeholder-gray-400 transition-all",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            hasLeftIcon() && "pl-10",
            !hasLeftIcon() && "px-4",
            props.error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            !props.error && "border-gray-300",
            props.class
          )}
        />
      </div>
      {props.error && <p class="text-sm text-red-500">{props.error}</p>}
    </div>
  )
}
