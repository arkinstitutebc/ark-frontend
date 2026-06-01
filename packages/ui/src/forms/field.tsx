import { type JSX, Show } from "solid-js"

export interface FieldProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: JSX.Element
}

/**
 * Standard form field wrapper — label (with optional required asterisk)
 * + child input + inline error message. Pair with `fieldInputClass()` to
 * style the underlying `<input>` consistently.
 *
 * ```tsx
 * <Field label="Email" required error={errors().email}>
 *   <input type="email" class={fieldInputClass(errors().email)} ... />
 * </Field>
 * ```
 */
export function Field(props: FieldProps) {
  return (
    <div>
      <span class="block text-sm font-medium text-foreground mb-1">
        {props.label}
        <Show when={props.required}>
          <span class="text-red-500 ml-0.5" aria-hidden="true">
            *
          </span>
        </Show>
      </span>
      {props.children}
      <Show when={props.error}>
        <p class="text-xs text-red-600 mt-1" role="alert">
          {props.error}
        </p>
      </Show>
      <Show when={!props.error && props.hint}>
        <p class="text-xs text-muted mt-1">{props.hint}</p>
      </Show>
    </div>
  )
}

/**
 * Standard input class string — border + focus ring + error-tinted border.
 * Use on `<input>`, `<textarea>`, etc. inside a `<Field>`.
 */
export function fieldInputClass(error?: string): string {
  return `w-full px-3 py-2 border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${error ? "border-red-300" : "border-border"}`
}
