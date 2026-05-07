import type { JSX } from "solid-js"
import { Show } from "solid-js"
import { Modal } from "./modal"
import { ModalFooter } from "./modal-footer"

export interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  title: string
  /** Body copy. Plain string or arbitrary JSX (for emphasis, lists, etc). */
  description?: string | JSX.Element
  confirmLabel?: string
  cancelLabel?: string
  /** Tints the confirm button accent (red) — for destructive actions. */
  danger?: boolean
  /** Disables confirm + shows pending state during the async action. */
  pending?: boolean
  onConfirm: () => void
}

/**
 * Generic confirm/destructive dialog. Built on `Modal` + `ModalFooter`.
 *
 * Replaces one-off confirm modals (e.g. ConfirmDeleteStudentModal) and
 * standardizes delete confirmations across all 7 portals.
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  return (
    <Modal open={props.open} onClose={props.onClose} title={props.title} size="md">
      <div class="space-y-4">
        <Show when={props.description}>
          <div class="text-sm text-foreground leading-relaxed">{props.description}</div>
        </Show>
        <ModalFooter
          onCancel={props.onClose}
          onSubmit={props.onConfirm}
          submitting={props.pending}
          submitLabel={props.confirmLabel ?? (props.danger ? "Delete" : "Confirm")}
          cancelLabel={props.cancelLabel ?? "Cancel"}
          danger={props.danger}
        />
      </div>
    </Modal>
  )
}
