import { type JSX, Show } from "solid-js"

export interface FormSectionProps {
  /** Section heading — rendered as `<h2>`. */
  title?: string
  /** Optional one-line caption under the title. */
  subtitle?: string
  /** Pass-through extra class on the outer card. */
  class?: string
  children: JSX.Element
}

/**
 * Standard "card" container used inside form pages — bg-surface + border +
 * rounded + padding, with an optional heading. Replaces the manually-typed
 * `<div class="bg-surface rounded-lg border border-border p-6">...</div>`
 * pattern that recurs across every create/edit page.
 *
 * ```tsx
 * <FormSection title="Claimant" subtitle="Name + position auto-prefill from your profile.">
 *   <Field label="Name" required>...</Field>
 * </FormSection>
 * ```
 */
export function FormSection(props: FormSectionProps) {
  return (
    <div class={`bg-surface rounded-lg border border-border p-6 ${props.class ?? ""}`}>
      <Show when={props.title}>
        <h2 class="text-lg font-semibold text-foreground">{props.title}</h2>
      </Show>
      <Show when={props.subtitle}>
        <p class="text-xs text-muted mt-1 mb-4">{props.subtitle}</p>
      </Show>
      <Show when={props.title && !props.subtitle}>
        <div class="mb-4" />
      </Show>
      {props.children}
    </div>
  )
}
