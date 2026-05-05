import { useMovements } from "@data/hooks"
import type { StockItem } from "@data/types"
import { For, Show } from "solid-js"
import { Icons } from "./ui/icons"
import { Modal } from "./ui/modal"

interface ViewItemModalProps {
  open: boolean
  onClose: () => void
  item: StockItem | null
  onAdjust: () => void
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr))
}

function _formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount)
}

export function ViewItemModal(props: ViewItemModalProps) {
  const item = () => props.item
  const movementsQuery = useMovements(() => (item()?.id ? { itemId: item()?.id } : {}))

  const itemMovements = () => {
    if (!item() || !movementsQuery.data) return []
    return movementsQuery.data.slice(0, 5)
  }

  const statusConfig = {
    "in-stock": {
      bg: "bg-green-50",
      text: "text-green-700",
      dot: "bg-green-400",
      label: "In Stock",
    },
    "low-stock": {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      dot: "bg-yellow-400",
      label: "Low Stock",
    },
    "out-of-stock": {
      bg: "bg-red-50",
      text: "text-red-700",
      dot: "bg-red-400",
      label: "Out of Stock",
    },
  }

  return (
    <Modal open={props.open} onClose={props.onClose} title="Item Details" size="lg">
      <Show when={item()}>
        {_item => {
          const config = statusConfig[_item().status]
          return (
            <div class="flex flex-col max-h-[70vh]">
              {/* Scrollable Content */}
              <div class="flex-1 overflow-y-auto space-y-5 pr-2">
                {/* Header Section */}
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <span class="font-mono text-sm font-medium text-gray-500">{_item().id}</span>
                      <span
                        class={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
                      >
                        <span class={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        {config.label}
                      </span>
                    </div>
                    <h3 class="text-xl text-gray-900">{_item().name}</h3>
                    <p class="text-sm text-gray-500 mt-1">{_item().category}</p>
                  </div>
                  <button
                    type="button"
                    onClick={props.onAdjust}
                    class="px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <Icons.plus class="w-4 h-4 inline mr-1" />
                    Adjust Stock
                  </button>
                </div>

                {/* Stock Summary Card */}
                <div class="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/10">
                  <div class="grid grid-cols-3 gap-4">
                    <div class="text-center">
                      <p class="text-xs text-primary/70 uppercase tracking-wide mb-1">On Hand</p>
                      <p class="text-2xl text-gray-900">
                        {_item().quantityOnHand}
                        <span class="text-sm font-normal text-gray-500 ml-1">{_item().unit}</span>
                      </p>
                    </div>
                    <div class="text-center border-x border-primary/10">
                      <p class="text-xs text-primary/70 uppercase tracking-wide mb-1">Reorder At</p>
                      <p class="text-2xl text-gray-900">
                        {_item().reorderLevel}
                        <span class="text-sm font-normal text-gray-500 ml-1">{_item().unit}</span>
                      </p>
                    </div>
                    <div class="text-center">
                      <p class="text-xs text-primary/70 uppercase tracking-wide mb-1">
                        Last Updated
                      </p>
                      <p class="text-sm font-medium text-gray-900">
                        {formatDate(_item().lastUpdated)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div>
                  <h4 class="text-sm font-medium text-gray-900 mb-3">Item Information</h4>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="bg-gray-50 rounded-lg px-4 py-3">
                      <p class="text-xs text-gray-500 mb-1">Category</p>
                      <p class="text-sm font-medium text-gray-900">{_item().category}</p>
                    </div>
                    <div class="bg-gray-50 rounded-lg px-4 py-3">
                      <p class="text-xs text-gray-500 mb-1">Unit of Measure</p>
                      <p class="text-sm font-medium text-gray-900">{_item().unit}</p>
                    </div>
                    <div class="bg-gray-50 rounded-lg px-4 py-3">
                      <p class="text-xs text-gray-500 mb-1">Reorder Level</p>
                      <p class="text-sm font-medium text-gray-900">
                        {_item().reorderLevel} {_item().unit}
                      </p>
                    </div>
                    <div class="bg-gray-50 rounded-lg px-4 py-3">
                      <p class="text-xs text-gray-500 mb-1">Last Updated</p>
                      <p class="text-sm font-medium text-gray-900">
                        {formatDate(_item().lastUpdated)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Batch Information */}
                <div>
                  <h4 class="text-sm font-medium text-gray-900 mb-3">Batch Information</h4>
                  <div class="bg-gray-50 rounded-lg px-4 py-3">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <p class="text-xs text-gray-500">Batch Code</p>
                        <p class="text-sm font-mono font-medium text-gray-900">
                          {_item().batchCode}
                        </p>
                      </div>
                      <div>
                        <p class="text-xs text-gray-500">Batch Name</p>
                        <p class="text-sm font-medium text-gray-900">{_item().batchName}</p>
                      </div>
                      {_item().poReference ? (
                        <>
                          <div>
                            <p class="text-xs text-gray-500">PO Reference</p>
                            <p class="text-sm font-medium text-gray-900">{_item().poReference}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500">Source</p>
                            <p class="text-sm font-medium text-gray-900">Procurement</p>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Recent Movements */}
                <Show when={itemMovements().length > 0}>
                  <div>
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="text-sm font-medium text-gray-900">Recent Movements</h4>
                      <a
                        href="/movements"
                        class="text-xs text-primary hover:text-primary/80 font-medium"
                      >
                        View all →
                      </a>
                    </div>
                    <div class="border border-gray-200 rounded-lg overflow-hidden">
                      <table class="w-full">
                        <thead class="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-600 uppercase">
                              Date
                            </th>
                            <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-600 uppercase">
                              Type
                            </th>
                            <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-600 uppercase">
                              Qty
                            </th>
                            <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-600 uppercase">
                              Reason
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <For each={itemMovements()}>
                            {movement => (
                              <tr class="border-b border-gray-100 last:border-b-0">
                                <td class="px-4 py-2.5 text-sm text-gray-600 whitespace-nowrap">
                                  {formatDate(movement.createdAt)}
                                </td>
                                <td class="px-4 py-2.5 text-sm">
                                  <span
                                    class={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      movement.type === "in"
                                        ? "bg-green-100 text-green-700"
                                        : movement.type === "out"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-yellow-100 text-yellow-700"
                                    }`}
                                  >
                                    {movement.type === "in"
                                      ? "IN"
                                      : movement.type === "out"
                                        ? "OUT"
                                        : "ADJ"}
                                  </span>
                                </td>
                                <td class="px-4 py-2.5 text-sm text-right font-medium text-gray-900">
                                  {movement.type === "out" ? "-" : "+"}
                                  {movement.quantity}
                                </td>
                                <td class="px-4 py-2.5 text-sm text-gray-600">
                                  {movement.reason || movement.reference || "-"}
                                </td>
                              </tr>
                            )}
                          </For>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Show>
              </div>

              {/* Footer Actions */}
              <div class="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={props.onClose}
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    props.onClose()
                    props.onAdjust()
                  }}
                  class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Adjust Stock
                </button>
              </div>
            </div>
          )
        }}
      </Show>
    </Modal>
  )
}
