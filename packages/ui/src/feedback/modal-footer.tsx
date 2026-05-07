interface ModalFooterProps {
  onCancel: () => void
  /** When provided, renders a Submit button. Omit for view-only modals. */
  onSubmit?: (e?: Event) => void
  /** If true, the submit button is `type="submit"` so it triggers the form. */
  submitInForm?: boolean
  submitLabel?: string
  cancelLabel?: string
  submitting?: boolean
  disabled?: boolean
  /** Tints the submit button accent (red) — for confirm-delete flows. */
  danger?: boolean
}

/**
 * Standardized Cancel + Submit row at the bottom of every modal.
 * Replaces the same `flex justify-end gap-3 pt-4 border-t border-border`
 * block that existed in 6+ training modals (and was about to spread further).
 *
 * Usage inside a `<form>`: pass `submitInForm` so the button is `type="submit"`
 * and the form's `onSubmit` handler fires.
 *
 * Usage outside a form: pass `onSubmit` and we wire it to a click handler.
 */
export function ModalFooter(props: ModalFooterProps) {
  const submitClass = () =>
    props.danger
      ? "px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-lg transition-colors disabled:opacity-50"
      : "px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"

  const submitText = () => {
    if (props.submitting) {
      return props.danger ? "Deleting..." : "Saving..."
    }
    return props.submitLabel ?? (props.danger ? "Delete" : "Save")
  }

  return (
    <div class="flex justify-end gap-3 pt-4 border-t border-border">
      <button
        type="button"
        onClick={props.onCancel}
        class="px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted rounded-lg transition-colors"
      >
        {props.cancelLabel ?? "Cancel"}
      </button>
      {props.submitInForm ? (
        <button type="submit" disabled={props.submitting || props.disabled} class={submitClass()}>
          {submitText()}
        </button>
      ) : props.onSubmit ? (
        <button
          type="button"
          onClick={props.onSubmit}
          disabled={props.submitting || props.disabled}
          class={submitClass()}
        >
          {submitText()}
        </button>
      ) : null}
    </div>
  )
}
