import { type Component, createUniqueId, type JSX, Show } from "solid-js"
import { cn } from "../utils"

// Icon props are Component refs, not JSX.Element values. Solid's hydration
// breaks when a JSX-as-prop getter contains lucide-solid template factories
// (V() called without its template arg → "TypeError: e is not a function").
// Component refs sidestep the getter-revaluation path.
type IconComponent = Component<{ class?: string }>

type InputProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  leftIcon?: IconComponent
  showPasswordToggle?: boolean
  showPassword?: boolean
  onTogglePassword?: () => void
  eyeIcon?: IconComponent
  eyeOffIcon?: IconComponent
}

const ICON_CLASS = "w-5 h-5"

export function Input(props: InputProps) {
  const fallbackId = createUniqueId()
  const inputId = () => props.id ?? fallbackId
  const hasLeftIcon = () => props.leftIcon !== undefined
  const hasPasswordToggle = () => props.showPasswordToggle === true

  return (
    <div class="flex flex-col gap-2">
      {props.label && (
        <label for={inputId()} class="text-sm font-medium text-foreground">
          {props.label}
        </label>
      )}
      <div class="relative">
        <Show when={props.leftIcon}>
          {LeftIcon => {
            const Icon = LeftIcon()
            return (
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                <Icon class={ICON_CLASS} />
              </div>
            )
          }}
        </Show>
        <input
          {...props}
          id={inputId()}
          type={props.showPassword ? "text" : props.type}
          class={cn(
            "block w-full py-2.5 border rounded-lg bg-surface text-foreground placeholder:text-muted transition-colors",
            "focus:outline-none focus:border-primary",
            hasLeftIcon() && "pl-10",
            hasPasswordToggle() && "pr-12",
            !hasLeftIcon() && !hasPasswordToggle() && "px-4",
            hasLeftIcon() && !hasPasswordToggle() && "pr-3",
            !hasLeftIcon() && hasPasswordToggle() && "pl-3 pr-12",
            props.error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            !props.error && "border-border",
            props.class
          )}
        />
        <Show when={hasPasswordToggle()}>
          <button
            type="button"
            onClick={props.onTogglePassword}
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground transition-colors"
            aria-label={props.showPassword ? "Hide password" : "Show password"}
          >
            <Show when={props.showPassword ? props.eyeOffIcon : props.eyeIcon}>
              {IconAccessor => {
                const Icon = IconAccessor()
                return <Icon class={ICON_CLASS} />
              }}
            </Show>
          </button>
        </Show>
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
        <label for={textareaId()} class="text-sm font-medium text-foreground">
          {props.label}
        </label>
      )}
      <textarea
        {...props}
        id={textareaId()}
        class={cn(
          "w-full px-4 py-2.5 border rounded-lg bg-surface text-foreground placeholder:text-muted outline-none transition-colors resize-none",
          "border-border focus:border-primary",
          props.error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          props.class
        )}
      />
      {props.error && <p class="text-sm text-red-500">{props.error}</p>}
    </div>
  )
}
