import { AlertTriangle, Info } from "lucide-solid"
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
  pendingLabel?: string
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
  const guardedClose = () => {
    if (props.pending) return
    props.onClose()
  }

  return (
    <Modal open={props.open} onClose={guardedClose} title={props.title} size="md">
      <div class="space-y-5">
        <div class="flex gap-4">
          <div
            class={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              props.danger
                ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                : "bg-primary/10 text-primary"
            }`}
            aria-hidden="true"
          >
            {(() => {
              const Icon = props.danger ? AlertTriangle : Info
              return <Icon class="h-5 w-5" />
            })()}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-foreground">
              {props.danger ? "This action needs confirmation." : "Review before continuing."}
            </p>
            <Show when={props.description}>
              <div class="mt-1 text-sm leading-relaxed text-muted">{props.description}</div>
            </Show>
          </div>
        </div>
        <ModalFooter
          onCancel={guardedClose}
          onSubmit={props.onConfirm}
          submitting={props.pending}
          submitLabel={props.confirmLabel ?? (props.danger ? "Delete" : "Confirm")}
          submitLoadingLabel={props.pendingLabel ?? (props.danger ? "Deleting..." : "Working...")}
          cancelLabel={props.cancelLabel ?? "Cancel"}
          danger={props.danger}
        />
      </div>
    </Modal>
  )
}
