import { API_URL } from "@ark/api-client"
import { formatDatePH, formatPeso, Modal } from "@ark/ui"
import type { PurchaseOrder } from "@data/types"
import { Show } from "solid-js"
import { PoStatusBadge } from "./ui/status-badges"

interface PoDocumentModalProps {
  open: boolean
  onClose: () => void
  po: PurchaseOrder | null
}

export function PoDocumentModal(props: PoDocumentModalProps) {
  return (
    <Modal open={props.open} onClose={props.onClose} title="Purchase Order Details" size="lg">
      <Show when={props.po}>
        {po => (
          <div class="flex flex-col max-h-[70vh]">
            {/* Scrollable Content */}
            <div class="flex-1 overflow-y-auto space-y-5 pr-2">
              {/* Header Section */}
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="font-mono text-sm font-medium text-foreground">
                    {po().poCode || po().id}
                  </span>
                  <PoStatusBadge status={po().status} />
                </div>
                <span class="text-lg font-semibold text-foreground">
                  {formatPeso(Number(po().totalAmount))}
                </span>
              </div>

              {/* Details Grid - improved with subtle cards */}
              <div class="grid grid-cols-2 gap-3">
                <div class="bg-surface-muted rounded-lg px-4 py-3">
                  <p class="text-xs text-muted mb-1">PR Reference</p>
                  <p class="text-sm font-mono font-medium text-foreground">{po().prId}</p>
                </div>
                <div class="bg-surface-muted rounded-lg px-4 py-3">
                  <p class="text-xs text-muted mb-1">Supplier</p>
                  <p class="text-sm font-semibold text-foreground">{po().supplier}</p>
                </div>
                <div class="bg-surface-muted rounded-lg px-4 py-3">
                  <p class="text-xs text-muted mb-1">Batch Name</p>
                  <p class="text-sm font-medium text-foreground">{po().batchName}</p>
                </div>
                <div class="bg-surface-muted rounded-lg px-4 py-3">
                  <p class="text-xs text-muted mb-1">Created Date</p>
                  <p class="text-sm font-medium text-foreground">{formatDatePH(po().createdAt)}</p>
                </div>
              </div>

              {/* Notes */}
              <Show when={po().notes}>
                <div>
                  <p class="text-xs text-muted mb-2">Notes</p>
                  <p class="text-sm text-foreground whitespace-pre-wrap">{po().notes}</p>
                </div>
              </Show>

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
                      {po().items.map(item => (
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
                          {formatPeso(Number(po().totalAmount))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Delivery Info */}
              <div class="bg-surface-muted rounded-lg p-4">
                <p class="text-xs text-muted mb-2">Delivery Information</p>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-xs text-muted mb-1">Estimated Delivery</p>
                    <p class="text-sm font-medium text-foreground">
                      {formatDatePH(po().estimatedDelivery)}
                    </p>
                  </div>
                  <Show when={po().actualDelivery}>
                    <div>
                      <p class="text-xs text-muted mb-1">Actual Delivery</p>
                      <p class="text-sm font-medium text-foreground">
                        {formatDatePH(po().actualDelivery)}
                      </p>
                    </div>
                  </Show>
                </div>
              </div>
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
                href={`${API_URL}/api/procurement/orders/${po().id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Download PDF
              </a>
            </div>
          </div>
        )}
      </Show>
    </Modal>
  )
}
