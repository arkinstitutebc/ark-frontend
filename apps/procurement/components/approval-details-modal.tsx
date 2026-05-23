import { categoryToneClass, formatDatePH, formatPeso, Modal, StatusBadge } from "@ark/ui"
import type { PurchaseRequest } from "@data/types"
import { createSignal, Show } from "solid-js"

export type ApprovalAction = "view" | "coordinator-review" | "approve" | "reject"

interface ApprovalDetailsModalProps {
  open: boolean
  onClose: () => void
  pr: PurchaseRequest | null
  mode: ApprovalAction
  onApprove: (id: string, notes?: string) => void
  onReject: (id: string, notes: string) => void
  onCoordinatorReview: (id: string, notes?: string) => void
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
    if (props.mode === "coordinator-review") return "Coordinator Review"
    return "Purchase Request Details"
  }

  const canCoordinatorReview = (pr: PurchaseRequest) =>
    pr.status === "pending" && props.mode === "coordinator-review"
  const canApprove = (pr: PurchaseRequest) =>
    pr.status === "under_review" && props.mode === "approve"
  const canReject = (pr: PurchaseRequest) =>
    (pr.status === "pending" || pr.status === "under_review") && props.mode === "reject"
  const actionable = (pr: PurchaseRequest) =>
    canCoordinatorReview(pr) || canApprove(pr) || canReject(pr)

  const handleApprove = () => {
    if (!props.pr) return
    props.onApprove(props.pr.id, notes().trim() || undefined)
    setNotes("")
    setShowError(false)
  }

  const handleCoordinatorReview = () => {
    if (!props.pr) return
    props.onCoordinatorReview(props.pr.id, notes().trim() || undefined)
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
                  <Show
                    when={pr().category}
                    fallback={<p class="text-sm font-medium text-foreground">—</p>}
                  >
                    <span
                      class={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${categoryToneClass(pr().category)}`}
                    >
                      {pr().category}
                    </span>
                  </Show>
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

              <Show
                when={
                  pr().expenseCategory ||
                  pr().profitCenter ||
                  pr().accountingTreatment ||
                  pr().costType ||
                  pr().dateNeeded
                }
              >
                <div>
                  <p class="text-xs text-muted mb-2">Accounting Classification</p>
                  <div class="grid grid-cols-2 gap-3">
                    <Show when={pr().dateNeeded}>
                      <div class="bg-surface-muted rounded-lg px-4 py-3">
                        <p class="text-xs text-muted mb-1">Date Needed</p>
                        <p class="text-sm font-medium text-foreground">
                          {formatDatePH(pr().dateNeeded ?? "")}
                        </p>
                      </div>
                    </Show>
                    <Show when={pr().expenseCategory}>
                      <div class="bg-surface-muted rounded-lg px-4 py-3">
                        <p class="text-xs text-muted mb-1">Expense Category</p>
                        <p class="text-sm font-medium text-foreground">{pr().expenseCategory}</p>
                      </div>
                    </Show>
                    <Show when={pr().profitCenter}>
                      <div class="bg-surface-muted rounded-lg px-4 py-3">
                        <p class="text-xs text-muted mb-1">Profit Center</p>
                        <p class="text-sm font-medium text-foreground">{pr().profitCenter}</p>
                      </div>
                    </Show>
                    <Show when={pr().accountingTreatment}>
                      <div class="bg-surface-muted rounded-lg px-4 py-3">
                        <p class="text-xs text-muted mb-1">Accounting Treatment</p>
                        <p class="text-sm font-medium text-foreground">
                          {pr().accountingTreatment}
                        </p>
                      </div>
                    </Show>
                    <Show when={pr().costType}>
                      <div class="bg-surface-muted rounded-lg px-4 py-3">
                        <p class="text-xs text-muted mb-1">Cost Type</p>
                        <p class="text-sm font-medium text-foreground">{pr().costType}</p>
                      </div>
                    </Show>
                  </div>
                </div>
              </Show>

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

              <Show
                when={
                  pr().status !== "pending" ||
                  pr().coordinatorReviewedBy ||
                  pr().coordinatorReviewedAt
                }
              >
                <div class="bg-surface-muted rounded-lg p-4 space-y-4">
                  <Show when={pr().coordinatorReviewedBy || pr().coordinatorReviewedAt}>
                    <div>
                      <p class="text-xs text-muted mb-2 font-medium uppercase tracking-wide">
                        Coordinator Review
                      </p>
                      <div class="grid grid-cols-2 gap-4">
                        <Show when={pr().coordinatorReviewedBy}>
                          <div>
                            <p class="text-xs text-muted mb-1">Reviewed By</p>
                            <p class="text-sm font-medium text-foreground">
                              {pr().coordinatorReviewedBy}
                            </p>
                          </div>
                        </Show>
                        <Show when={pr().coordinatorReviewedAt}>
                          <div>
                            <p class="text-xs text-muted mb-1">Review Date</p>
                            <p class="text-sm font-medium text-foreground">
                              {formatDatePH(pr().coordinatorReviewedAt ?? "")}
                            </p>
                          </div>
                        </Show>
                        <Show when={pr().coordinatorNotes}>
                          <div class="col-span-2">
                            <p class="text-xs text-muted mb-1">Notes</p>
                            <p class="text-sm text-foreground">{pr().coordinatorNotes}</p>
                          </div>
                        </Show>
                      </div>
                    </div>
                  </Show>

                  <Show when={pr().approvedBy || pr().approvedAt}>
                    <div>
                      <p class="text-xs text-muted mb-2 font-medium uppercase tracking-wide">
                        Management Approval
                      </p>
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
                </div>
              </Show>

              <Show when={actionable(pr())}>
                <div>
                  <label for="approval-notes" class="text-xs text-muted mb-2 block">
                    {notesRequired()
                      ? "Reason for rejection"
                      : props.mode === "coordinator-review"
                        ? "Coordinator notes (optional)"
                        : "Approval notes (optional)"}
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
                        : props.mode === "coordinator-review"
                          ? "Comments for management before final approval..."
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
              <Show when={canCoordinatorReview(pr())}>
                <button
                  type="button"
                  onClick={handleCoordinatorReview}
                  disabled={props.processing}
                  class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {props.processing ? "Submitting..." : "Submit coordinator review"}
                </button>
              </Show>
              <Show when={canApprove(pr())}>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={props.processing}
                  class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {props.processing ? "Approving..." : "Confirm approval"}
                </button>
              </Show>
              <Show when={canReject(pr())}>
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
