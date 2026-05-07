import { API_URL } from "@ark/api-client"
import { formatDatePH, formatPeso, Modal } from "@ark/ui"
import type { PurchaseRequest } from "@data/types"
import { Show } from "solid-js"
import { PrStatusBadge } from "./ui/status-badges"

interface PrDocumentModalProps {
  open: boolean
  onClose: () => void
  pr: PurchaseRequest | null
}

export function PrDocumentModal(props: PrDocumentModalProps) {
  return (
    <Modal open={props.open} onClose={props.onClose} title="Purchase Request Details" size="lg">
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
                  <PrStatusBadge status={pr().status} />
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
            </div>

            {/* Fixed Action Buttons */}
            <div class="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
              <button
                type="button"
                onClick={props.onClose}
                class="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted transition-colors cursor-pointer"
              >
                Close
              </button>
              <a
                href={`${API_URL}/api/procurement/requests/${pr().id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
              >
                View PDF
              </a>
            </div>
          </div>
        )}
      </Show>
    </Modal>
  )
}
