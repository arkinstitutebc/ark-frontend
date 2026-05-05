import type { PurchaseOrder } from "@data/types"
import { Show } from "solid-js"
import { Modal } from "./ui/modal"
import { PoStatusBadge } from "./ui/status-badges"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount)
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-"
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr))
}

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
                  <span class="font-mono text-sm font-medium text-gray-900">
                    {po().poCode || po().id}
                  </span>
                  <PoStatusBadge status={po().status} />
                </div>
                <span class="text-lg font-semibold text-gray-900">
                  {formatCurrency(Number(po().totalAmount))}
                </span>
              </div>

              {/* Details Grid - improved with subtle cards */}
              <div class="grid grid-cols-2 gap-3">
                <div class="bg-gray-50 rounded-lg px-4 py-3">
                  <p class="text-xs text-gray-500 mb-1">PR Reference</p>
                  <p class="text-sm font-mono font-medium text-gray-900">{po().prId}</p>
                </div>
                <div class="bg-gray-50 rounded-lg px-4 py-3">
                  <p class="text-xs text-gray-500 mb-1">Supplier</p>
                  <p class="text-sm font-semibold text-gray-900">{po().supplier}</p>
                </div>
                <div class="bg-gray-50 rounded-lg px-4 py-3">
                  <p class="text-xs text-gray-500 mb-1">Batch Name</p>
                  <p class="text-sm font-medium text-gray-900">{po().batchName}</p>
                </div>
                <div class="bg-gray-50 rounded-lg px-4 py-3">
                  <p class="text-xs text-gray-500 mb-1">Created Date</p>
                  <p class="text-sm font-medium text-gray-900">{formatDate(po().createdAt)}</p>
                </div>
              </div>

              {/* Notes */}
              <Show when={po().notes}>
                <div>
                  <p class="text-xs text-gray-500 mb-2">Notes</p>
                  <p class="text-sm text-gray-900 whitespace-pre-wrap">{po().notes}</p>
                </div>
              </Show>

              {/* Items Table */}
              <div>
                <p class="text-xs text-gray-500 mb-2">Items</p>
                <div class="border border-gray-200 rounded-lg overflow-hidden">
                  <table class="w-full">
                    <thead class="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th class="text-left px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                          Item
                        </th>
                        <th class="text-center px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                          Qty
                        </th>
                        <th class="text-right px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                          Price
                        </th>
                        <th class="text-right px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {po().items.map(item => (
                        <tr class="border-b border-gray-100 last:border-b-0">
                          <td class="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                          <td class="px-4 py-3 text-sm text-gray-900 text-center">
                            {item.quantity} {item.unit}
                          </td>
                          <td class="px-4 py-3 text-sm text-gray-900 text-right">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td class="px-4 py-3 text-sm text-gray-900 text-right">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot class="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td
                          colSpan={3}
                          class="px-4 py-3 text-sm font-semibold text-gray-900 text-right"
                        >
                          Grand Total
                        </td>
                        <td class="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                          {formatCurrency(Number(po().totalAmount))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Delivery Info */}
              <div class="bg-gray-50 rounded-lg p-4">
                <p class="text-xs text-gray-500 mb-2">Delivery Information</p>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-xs text-gray-500 mb-1">Estimated Delivery</p>
                    <p class="text-sm font-medium text-gray-900">
                      {formatDate(po().estimatedDelivery)}
                    </p>
                  </div>
                  <Show when={po().actualDelivery}>
                    <div>
                      <p class="text-xs text-gray-500 mb-1">Actual Delivery</p>
                      <p class="text-sm font-medium text-gray-900">
                        {formatDate(po().actualDelivery)}
                      </p>
                    </div>
                  </Show>
                </div>
              </div>
            </div>

            {/* Fixed Action Buttons */}
            <div class="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={props.onClose}
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Print / Export PDF
              </button>
            </div>
          </div>
        )}
      </Show>
    </Modal>
  )
}
