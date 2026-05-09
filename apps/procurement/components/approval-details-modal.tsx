import { formatDatePH, formatPeso, Modal } from "@ark/ui"
import type { PrStatus, PurchaseRequest } from "@data/types"
import { createSignal, Show } from "solid-js"

const statusColors: Record<PrStatus, { bg: string; text: string; dot: string }> = {
  pending: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
  approved: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  rejected: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
  ordered: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
}

function StatusBadge(props: { status: PrStatus }) {
  const colors = statusColors[props.status]
  const label = props.status.charAt(0).toUpperCase() + props.status.slice(1)
  return (
    <span
      class={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <span class={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  )
}

/**
 * Three modes drive what the modal does:
 *  - `view`   — read-only details (no action buttons)
 *  - `approve` — approve flow; notes optional
 *  - `reject`  — reject flow; notes REQUIRED (matches server-side `min(1)`)
 */
export type ApprovalAction = "view" | "approve" | "reject"

interface ApprovalDetailsModalProps {
  open: boolean
  onClose: () => void
  pr: PurchaseRequest | null
  /** What the user is about to do — drives buttons + notes-required UI. */
  mode: ApprovalAction
  onApprove: (id: string, notes?: string) => void
  onReject: (id: string, notes: string) => void
  processing: boolean
}

export function ApprovalDetailsModal(props: ApprovalDetailsModalProps) {
  const [notes, setNotes] = createSignal("")
  const [showError, setShowError] = createSignal(false)

  const notesRequired = () => props.mode === "reject"
  const notesValid = () => !notesRequired() || notes().trim().length > 0

  const modalTitle = () => {
    if (props.mode === "approve") return "Approve Purchase Request"
    if (props.mode === "reject") return "Reject Purchase Request"
    return "Purchase Request Details"
  }

  const handleApprove = () => {
    if (!props.pr) return
    props.onApprove(props.pr.id, notes().trim() || undefined)
    setNotes("")
    setShowError(false)
  }

  const handleReject = () => {
    if (!props.pr) return
    if (!notesValid()) {
      setShowError(true)
      return
    }
    props.onReject(props.pr.id, notes().trim())
    setNotes("")
    setShowError(false)
  }

  const handleClose = () => {
    setNotes("")
    setShowError(false)
    props.onClose()
  }

  return (
    <Modal open={props.open} onClose={handleClose} title={modalTitle()} size="lg">
      <Show when={props.pr}>
        {pr => (
          <div class="flex flex-col max-h-[70vh]">
            {/* Scrollable Content */}
            <div class="flex-1 overflow-y-auto space-y-5 pr-2">
              {/* Header Section */}
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="font-mono text-sm font-medium text-foreground">
                    {pr().prCode || pr().id}
                  </span>
                  <StatusBadge status={pr().status} />
                </div>
                <span class="text-lg font-semibold text-foreground">
                  {formatPeso(Number(pr().totalAmount))}
                </span>
              </div>

              {/* Details Grid - improved with subtle cards */}
              <div class="grid grid-cols-2 gap-3">
                <div class="bg-surface-muted rounded-lg px-4 py-3">
                  <p class="text-xs text-muted mb-1">Batch Name</p>
                  <p class="text-sm font-semibold text-foreground">{pr().batchName}</p>
                </div>
                <div class="bg-surface-muted rounded-lg px-4 py-3">
                  <p class="text-xs text-muted mb-1">Batch Code</p>
                  <p class="text-sm font-mono font-medium text-foreground">{pr().batchCode}</p>
                </div>
                <div class="bg-surface-muted rounded-lg px-4 py-3">
                  <p class="text-xs text-muted mb-1">Category</p>
                  <p class="text-sm font-medium text-foreground">{pr().category}</p>
                </div>
                <div class="bg-surface-muted rounded-lg px-4 py-3">
                  <p class="text-xs text-muted mb-1">Created Date</p>
                  <p class="text-sm font-medium text-foreground">{formatDatePH(pr().createdAt)}</p>
                </div>
                <div class="bg-primary/5 rounded-lg px-4 py-3 col-span-2 border border-primary/10">
                  <p class="text-xs text-primary/70 mb-1">Created By</p>
                  <p class="text-sm font-semibold text-foreground">{pr().createdBy}</p>
                </div>
              </div>

              {/* Purpose Section */}
              <div>
                <p class="text-xs text-muted mb-2">Purpose</p>
                <p class="text-sm text-foreground whitespace-pre-wrap">{pr().purpose}</p>
              </div>

              {/* Items Table */}
              <div>
                <p class="text-xs text-muted mb-2">Items</p>
                <div class="border border-border rounded-lg overflow-hidden">
                  <table class="w-full">
                    <thead class="bg-surface-muted border-b border-border">
                      <tr>
                        <th class="text-left px-4 py-2 text-xs font-semibold text-muted uppercase">
                          Item
                        </th>
                        <th class="text-center px-4 py-2 text-xs font-semibold text-muted uppercase">
                          Qty
                        </th>
                        <th class="text-right px-4 py-2 text-xs font-semibold text-muted uppercase">
                          Price
                        </th>
                        <th class="text-right px-4 py-2 text-xs font-semibold text-muted uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pr().items.map(item => (
                        <tr class="border-b border-border last:border-b-0">
                          <td class="px-4 py-3 text-sm text-foreground">{item.name}</td>
                          <td class="px-4 py-3 text-sm text-foreground text-center">
                            {item.quantity} {item.unit}
                          </td>
                          <td class="px-4 py-3 text-sm text-foreground text-right">
                            {formatPeso(item.unitPrice)}
                          </td>
                          <td class="px-4 py-3 text-sm text-foreground text-right">
                            {formatPeso(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot class="bg-surface-muted border-t border-border">
                      <tr>
                        <td
                          colSpan={3}
                          class="px-4 py-3 text-sm font-semibold text-foreground text-right"
                        >
                          Grand Total
                        </td>
                        <td class="px-4 py-3 text-sm font-semibold text-foreground text-right">
                          {formatPeso(Number(pr().totalAmount))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Approval Info */}
              <Show when={pr().status !== "pending"}>
                <div class="bg-surface-muted rounded-lg p-4">
                  <p class="text-xs text-muted mb-2">Approval Details</p>
                  <div class="grid grid-cols-2 gap-4">
                    <Show when={pr().approvedBy}>
                      <div>
                        <p class="text-xs text-muted mb-1">Approved By</p>
                        <p class="text-sm font-medium text-foreground">{pr().approvedBy}</p>
                      </div>
                    </Show>
                    <Show when={pr().approvedAt}>
                      <div>
                        <p class="text-xs text-muted mb-1">Approved Date</p>
                        <p class="text-sm font-medium text-foreground">
                          {formatDatePH(pr().approvedAt ?? "")}
                        </p>
                      </div>
                    </Show>
                    <Show when={pr().approvalNotes}>
                      <div class="col-span-2">
                        <p class="text-xs text-muted mb-1">Notes</p>
                        <p class="text-sm text-foreground">{pr().approvalNotes}</p>
                      </div>
                    </Show>
                  </div>
                </div>
              </Show>

              {/* Notes — only for pending PRs being acted on */}
              <Show when={pr().status === "pending" && props.mode !== "view"}>
                <div>
                  <label for="approval-notes" class="text-xs text-muted mb-2 block">
                    {notesRequired() ? "Reason for rejection" : "Approval notes (optional)"}
                    <Show when={notesRequired()}>
                      <span class="text-red-500 ml-0.5">*</span>
                    </Show>
                  </label>
                  <textarea
                    id="approval-notes"
                    value={notes()}
                    onInput={e => {
                      setNotes(e.currentTarget.value)
                      if (showError()) setShowError(false)
                    }}
                    placeholder={
                      notesRequired()
                        ? "Tell the requester what to fix so they can resubmit..."
                        : "Add notes for this approval..."
                    }
                    rows={3}
                    class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 resize-none ${
                      showError()
                        ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                        : "border-border focus:ring-primary/20 focus:border-primary"
                    }`}
                  />
                  <Show when={showError()}>
                    <p class="text-xs text-red-600 mt-1">
                      A reason is required when rejecting — it goes back to the requester.
                    </p>
                  </Show>
                </div>
              </Show>
            </div>

            {/* Fixed Action Buttons */}
            <div class="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
              <button
                type="button"
                onClick={handleClose}
                disabled={props.processing}
                class="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <Show when={pr().status === "pending" && props.mode === "approve"}>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={props.processing}
                  class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {props.processing ? "Approving..." : "Confirm approval"}
                </button>
              </Show>
              <Show when={pr().status === "pending" && props.mode === "reject"}>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={props.processing}
                  class="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {props.processing ? "Rejecting..." : "Confirm rejection"}
                </button>
              </Show>
            </div>
          </div>
        )}
      </Show>
    </Modal>
  )
}
