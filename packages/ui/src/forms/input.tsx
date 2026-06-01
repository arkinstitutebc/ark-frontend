import { type Component, createUniqueId, type JSX, Show, splitProps } from "solid-js"
import { cn } from "../utils"

// Icon props are Component refs, not JSX.Element values. Solid's hydration
// breaks when a JSX-as-prop getter contains lucide-solid template factories
// (V() called without its template arg → "TypeError: e is not a function").
// Component refs sidestep the getter-revaluation path.
type IconComponent = Component<{ class?: string }>

type InputProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
  leftIcon?: IconComponent
  showPasswordToggle?: boolean
  showPassword?: boolean
  onTogglePassword?: () => void
  eyeIcon?: IconComponent
  eyeOffIcon?: IconComponent
}

const ICON_CLASS = "w-5 h-5"

export function Input(props: InputProps) {
  const [local, inputProps] = splitProps(props, [
    "class",
    "error",
    "eyeIcon",
    "eyeOffIcon",
    "hint",
    "id",
    "label",
    "leftIcon",
    "onTogglePassword",
    "showPassword",
    "showPasswordToggle",
    "type",
  ])
  const fallbackId = createUniqueId()
  const inputId = () => local.id ?? fallbackId
  const errorId = `${fallbackId}-error`
  const hintId = `${fallbackId}-hint`
  const hasLeftIcon = () => local.leftIcon !== undefined
  const hasPasswordToggle = () => local.showPasswordToggle === true
  const describedBy = () =>
    [
      inputProps["aria-describedby"],
      local.error ? errorId : undefined,
      !local.error && local.hint ? hintId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined

  return (
    <div class="flex flex-col gap-2">
      {local.label && (
        <label for={inputId()} class="text-sm font-medium text-foreground">
          {local.label}
        </label>
      )}
      <div class="relative">
        <Show when={local.leftIcon}>
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
          {...inputProps}
          id={inputId()}
          type={local.showPassword ? "text" : local.type}
          aria-describedby={describedBy()}
          aria-invalid={local.error ? "true" : undefined}
          class={cn(
            "block w-full py-2.5 border rounded-lg bg-surface text-foreground placeholder:text-muted transition-colors",
            "focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
            "disabled:bg-surface-muted disabled:cursor-not-allowed disabled:text-muted",
            hasLeftIcon() && "pl-10",
            hasPasswordToggle() && "pr-12",
            !hasLeftIcon() && !hasPasswordToggle() && "px-4",
            hasLeftIcon() && !hasPasswordToggle() && "pr-3",
            !hasLeftIcon() && hasPasswordToggle() && "pl-3 pr-12",
            local.error && "border-red-500 focus:border-red-500 focus-visible:ring-red-500/20",
            !local.error && "border-border",
            local.class
          )}
        />
        <Show when={hasPasswordToggle()}>
          <button
            type="button"
            onClick={local.onTogglePassword}
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-foreground"
            aria-label={local.showPassword ? "Hide password" : "Show password"}
          >
            <Show when={local.showPassword ? local.eyeOffIcon : local.eyeIcon}>
              {IconAccessor => {
                const Icon = IconAccessor()
                return <Icon class={ICON_CLASS} />
              }}
            </Show>
          </button>
        </Show>
      </div>
      <Show when={local.error}>
        <p id={errorId} class="text-sm text-red-500" role="alert">
          {local.error}
        </p>
      </Show>
      <Show when={!local.error && local.hint}>
        <p id={hintId} class="text-xs text-muted">
          {local.hint}
        </p>
      </Show>
    </div>
  )
}

export function Textarea(
  props: JSX.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string
    error?: string
    hint?: string
  }
) {
  const [local, textareaProps] = splitProps(props, ["class", "error", "hint", "id", "label"])
  const fallbackId = createUniqueId()
  const textareaId = () => local.id ?? fallbackId
  const errorId = `${fallbackId}-error`
  const hintId = `${fallbackId}-hint`
  const describedBy = () =>
    [
      textareaProps["aria-describedby"],
      local.error ? errorId : undefined,
      !local.error && local.hint ? hintId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined

  return (
    <div class="flex flex-col gap-1.5">
      {local.label && (
        <label for={textareaId()} class="text-sm font-medium text-foreground">
          {local.label}
        </label>
      )}
      <textarea
        {...textareaProps}
        id={textareaId()}
        aria-describedby={describedBy()}
        aria-invalid={local.error ? "true" : undefined}
        class={cn(
          "w-full px-4 py-2.5 border rounded-lg bg-surface text-foreground placeholder:text-muted outline-none transition-colors resize-none",
          "border-border focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
          "disabled:bg-surface-muted disabled:cursor-not-allowed disabled:text-muted",
          local.error && "border-red-500 focus:border-red-500 focus-visible:ring-red-500/20",
          local.class
        )}
      />
      <Show when={local.error}>
        <p id={errorId} class="text-sm text-red-500" role="alert">
          {local.error}
        </p>
      </Show>
      <Show when={!local.error && local.hint}>
        <p id={hintId} class="text-xs text-muted">
          {local.hint}
        </p>
      </Show>
    </div>
  )
}
