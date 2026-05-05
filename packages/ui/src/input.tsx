import { type JSX, createUniqueId } from "solid-js"
import { cn } from "./utils"

type InputProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  leftIcon?: JSX.Element
  showPasswordToggle?: boolean
  showPassword?: boolean
  onTogglePassword?: () => void
  eyeIcon?: JSX.Element
  eyeOffIcon?: JSX.Element
}

export function Input(props: InputProps) {
  const fallbackId = createUniqueId()
  const inputId = () => props.id ?? fallbackId
  const hasLeftIcon = () => props.leftIcon !== undefined
  const hasPasswordToggle = () => props.showPasswordToggle === true

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
          type={props.showPassword ? "text" : props.type}
          class={cn(
            "block w-full py-2.5 border rounded-lg text-gray-900 placeholder-gray-400 transition-all",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            hasLeftIcon() && "pl-10",
            hasPasswordToggle() && "pr-12",
            !hasLeftIcon() && !hasPasswordToggle() && "px-4",
            hasLeftIcon() && !hasPasswordToggle() && "pr-3",
            !hasLeftIcon() && hasPasswordToggle() && "pl-3 pr-12",
            props.error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            !props.error && "border-gray-300",
            props.class
          )}
        />
        {hasPasswordToggle() && (
          <button
            type="button"
            onClick={props.onTogglePassword}
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={props.showPassword ? "Hide password" : "Show password"}
          >
            {props.showPassword ? props.eyeOffIcon : props.eyeIcon}
          </button>
        )}
      </div>
      {props.error && <p class="text-sm text-red-500">{props.error}</p>}
    </div>
  )
}

export function Textarea(
  props: JSX.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string
    error?: string
  }
) {
  const fallbackId = createUniqueId()
  const textareaId = () => props.id ?? fallbackId

  return (
    <div class="flex flex-col gap-1.5">
      {props.label && (
        <label for={textareaId()} class="text-sm font-medium text-gray-700">
          {props.label}
        </label>
      )}
      <textarea
        {...props}
        id={textareaId()}
        class={cn(
          "w-full px-4 py-2.5 border rounded-lg outline-none transition-all resize-none",
          "border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20",
          props.error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          props.class
        )}
      />
      {props.error && <p class="text-sm text-red-500">{props.error}</p>}
    </div>
  )
}
