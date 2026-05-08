import { Icons, Modal } from "@ark/ui"
import { useMovements } from "@data/hooks"
import type { StockItem } from "@data/types"
import { For, Show } from "solid-js"

const PROCUREMENT_PORTAL_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_PROCUREMENT_PORTAL_URL) ||
  "https://procurement.arkinstitutebc.com"

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
                      <span class="font-mono text-sm font-medium text-muted">{_item().id}</span>
                      <span
                        class={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
                      >
                        <span class={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        {config.label}
                      </span>
                    </div>
                    <h3 class="text-xl text-foreground">{_item().name}</h3>
                    <p class="text-sm text-muted mt-1">{_item().category}</p>
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
                      <p class="text-2xl text-foreground">
                        {_item().quantityOnHand}
                        <span class="text-sm font-normal text-muted ml-1">{_item().unit}</span>
                      </p>
                    </div>
                    <div class="text-center border-x border-primary/10">
                      <p class="text-xs text-primary/70 uppercase tracking-wide mb-1">Reorder At</p>
                      <p class="text-2xl text-foreground">
                        {_item().reorderLevel}
                        <span class="text-sm font-normal text-muted ml-1">{_item().unit}</span>
                      </p>
                    </div>
                    <div class="text-center">
                      <p class="text-xs text-primary/70 uppercase tracking-wide mb-1">
                        Last Updated
                      </p>
                      <p class="text-sm font-medium text-foreground">
                        {formatDate(_item().lastUpdated)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div>
                  <h4 class="text-sm font-medium text-foreground mb-3">Item Information</h4>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="bg-surface-muted rounded-lg px-4 py-3">
                      <p class="text-xs text-muted mb-1">Category</p>
                      <p class="text-sm font-medium text-foreground">{_item().category}</p>
                    </div>
                    <div class="bg-surface-muted rounded-lg px-4 py-3">
                      <p class="text-xs text-muted mb-1">Unit of Measure</p>
                      <p class="text-sm font-medium text-foreground">{_item().unit}</p>
                    </div>
                    <div class="bg-surface-muted rounded-lg px-4 py-3">
                      <p class="text-xs text-muted mb-1">Reorder Level</p>
                      <p class="text-sm font-medium text-foreground">
                        {_item().reorderLevel} {_item().unit}
                      </p>
                    </div>
                    <div class="bg-surface-muted rounded-lg px-4 py-3">
                      <p class="text-xs text-muted mb-1">Last Updated</p>
                      <p class="text-sm font-medium text-foreground">
                        {formatDate(_item().lastUpdated)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Batch Information */}
                <div>
                  <h4 class="text-sm font-medium text-foreground mb-3">Batch Information</h4>
                  <div class="bg-surface-muted rounded-lg px-4 py-3">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <p class="text-xs text-muted">Batch Code</p>
                        <p class="text-sm font-mono font-medium text-foreground">
                          {_item().batchCode}
                        </p>
                      </div>
                      <div>
                        <p class="text-xs text-muted">Batch Name</p>
                        <p class="text-sm font-medium text-foreground">{_item().batchName}</p>
                      </div>
                      {_item().poReference ? (
                        <>
                          <div>
                            <p class="text-xs text-muted">PO Reference</p>
                            <a
                              href={`${PROCUREMENT_PORTAL_URL}/orders`}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 hover:underline"
                              title="Open in procurement portal"
                            >
                              {_item().poReference}
                              <Icons.arrowRight class="w-3.5 h-3.5" />
                            </a>
                          </div>
                          <div>
                            <p class="text-xs text-muted">Source</p>
                            <p class="text-sm font-medium text-foreground">Procurement</p>
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
                      <h4 class="text-sm font-medium text-foreground">Recent Movements</h4>
                      <a
                        href="/movements"
                        class="text-xs text-primary hover:text-primary/80 font-medium"
                      >
                        View all →
                      </a>
                    </div>
                    <div class="border border-border rounded-lg overflow-hidden">
                      <table class="w-full">
                        <thead class="bg-surface-muted border-b border-border">
                          <tr>
                            <th class="text-left px-4 py-2.5 text-xs font-medium text-muted uppercase">
                              Date
                            </th>
                            <th class="text-left px-4 py-2.5 text-xs font-medium text-muted uppercase">
                              Type
                            </th>
                            <th class="text-right px-4 py-2.5 text-xs font-medium text-muted uppercase">
                              Qty
                            </th>
                            <th class="text-left px-4 py-2.5 text-xs font-medium text-muted uppercase">
                              Reason
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <For each={itemMovements()}>
                            {movement => (
                              <tr class="border-b border-border last:border-b-0">
                                <td class="px-4 py-2.5 text-sm text-muted whitespace-nowrap">
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
                                <td class="px-4 py-2.5 text-sm text-right font-medium text-foreground">
                                  {movement.type === "out" ? "-" : "+"}
                                  {movement.quantity}
                                </td>
                                <td class="px-4 py-2.5 text-sm text-muted">
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
              <div class="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
                <button
                  type="button"
                  onClick={props.onClose}
                  class="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted transition-colors"
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
