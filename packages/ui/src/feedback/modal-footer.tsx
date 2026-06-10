import { Button } from "../forms/button"

export const modalFooterClass =
  "sticky bottom-0 z-20 -mx-6 -mb-5 flex justify-end gap-3 border-t border-border bg-surface px-6 py-3 shadow-[0_-8px_16px_rgba(15,23,42,0.06)]"

interface ModalFooterProps {
  onCancel: () => void
  /** When provided, renders a Submit button. Omit for view-only modals. */
  onSubmit?: (e?: Event) => void
  /** If true, the submit button is `type="submit"` so it triggers the form. */
  submitInForm?: boolean
  submitLabel?: string
  submitLoadingLabel?: string
  cancelLabel?: string
  submitting?: boolean
  disabled?: boolean
  /** Tints the submit button accent (red) — for confirm-delete flows. */
  danger?: boolean
  /** Keep Cancel usable during an in-flight submit. Defaults to false. */
  allowCancelWhileSubmitting?: boolean
}

/**
 * Standardized Cancel + Submit row at the bottom of every modal.
 * It is sticky inside the modal scroll area so actions stay reachable while
 * long forms/details scroll. Keep the styling centralized with
 * `modalFooterClass`; custom action rows should reuse that class.
 * Replaces the same `flex justify-end gap-3 pt-4 border-t border-border`
 * block that existed in 6+ training modals (and was about to spread further).
 *
 * Usage inside a `<form>`: pass `submitInForm` so the button is `type="submit"`
 * and the form's `onSubmit` handler fires.
 *
 * Usage outside a form: pass `onSubmit` and we wire it to a click handler.
 */
export function ModalFooter(props: ModalFooterProps) {
  const submitText = () => {
    return props.submitLabel ?? (props.danger ? "Delete" : "Save")
  }
  const submitLoadingText = () =>
    props.submitLoadingLabel ?? (props.danger ? "Deleting..." : "Saving...")

  return (
    <div class={modalFooterClass}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={props.onCancel}
        disabled={props.submitting && !props.allowCancelWhileSubmitting}
      >
        {props.cancelLabel ?? "Cancel"}
      </Button>
      {props.submitInForm ? (
        <Button
          type="submit"
          variant={props.danger ? "accent" : "primary"}
          size="sm"
          loading={props.submitting}
          loadingLabel={submitLoadingText()}
          disabled={props.disabled}
        >
          {submitText()}
        </Button>
      ) : props.onSubmit ? (
        <Button
          type="button"
          variant={props.danger ? "accent" : "primary"}
          size="sm"
          onClick={props.onSubmit}
          loading={props.submitting}
          loadingLabel={submitLoadingText()}
          disabled={props.disabled}
        >
          {submitText()}
        </Button>
      ) : null}
    </div>
  )
}
