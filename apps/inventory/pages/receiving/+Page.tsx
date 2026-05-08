import { api } from "@data/api"
import { useReceivePo } from "@data/hooks"
import { queryKeys } from "@data/query-keys"
import type { PurchaseOrder } from "@data/types"
import { createQuery } from "@tanstack/solid-query"
import { createSignal, For, Show } from "solid-js"
import { Icons } from "@/components/ui"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount)
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-"
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr))
}

interface ReceivedItem {
  poItemId: string
  itemName: string
  unit?: string
  quantityOrdered: number
  quantityReceived: number
}

export default function ReceivingPage() {
  // Fetch POs with status "sent" or "partial" from procurement API
  const ordersQuery = createQuery(() => ({
    queryKey: queryKeys.orders.all,
    queryFn: () => api<PurchaseOrder[]>("/api/procurement/orders?status=sent"),
  }))

  const receiveMutation = useReceivePo()

  const [selectedPo, setSelectedPo] = createSignal<PurchaseOrder | null>(null)
  const [receivedItems, setReceivedItems] = createSignal<Record<string, ReceivedItem>>({})
  const [showSuccess, setShowSuccess] = createSignal(false)

  const openPo = (po: PurchaseOrder) => {
    setSelectedPo(po)
    const items: Record<string, ReceivedItem> = {}
    for (const item of po.items as Array<{
      id: string
      name: string
      unit?: string
      quantity: number
    }>) {
      items[item.id] = {
        poItemId: item.id,
        itemName: item.name,
        unit: item.unit,
        quantityOrdered: item.quantity,
        quantityReceived: 0,
      }
    }
    setReceivedItems(items)
  }

  const closePo = () => {
    setSelectedPo(null)
    setReceivedItems({})
  }

  const updateReceivedQty = (id: string, qty: number) => {
    setReceivedItems(prev => ({
      ...prev,
      [id]: { ...prev[id], quantityReceived: Math.max(0, qty) },
    }))
  }

  const hasReceivedItems = () => Object.values(receivedItems()).some(i => i.quantityReceived > 0)
  const totalReceived = () =>
    Object.values(receivedItems()).reduce((sum, i) => sum + i.quantityReceived, 0)

  const handleCompleteReceipt = () => {
    const po = selectedPo()
    if (!po || !hasReceivedItems()) return

    // Backend upserts inventory_items keyed by (batchId, name) — no need to
    // pre-create rows. We send the PO line's name + unit so newly-received
    // items are auto-created on the inventory side.
    const items = Object.values(receivedItems())
      .filter(i => i.quantityReceived > 0)
      .map(i => ({
        name: i.itemName,
        unit: i.unit,
        quantityReceived: i.quantityReceived,
      }))

    receiveMutation.mutate(
      { poId: po.id, items },
      {
        onSuccess: () => {
          setShowSuccess(true)
          setTimeout(() => {
            setShowSuccess(false)
            closePo()
          }, 2000)
        },
      }
    )
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-foreground">New Receipt</h1>
        <p class="text-sm text-muted mt-1">Receive goods from purchase orders</p>
      </div>

      <Show when={showSuccess()}>
        <div class="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <Icons.checkCircle class="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p class="text-sm font-semibold text-green-800">Receipt completed!</p>
            <p class="text-sm text-green-600">Stock has been updated.</p>
          </div>
        </div>
      </Show>

      <Show when={receiveMutation.isError}>
        <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-sm text-red-700">{receiveMutation.error?.message}</p>
        </div>
      </Show>

      <Show when={!selectedPo()}>
        <Show when={ordersQuery.isLoading}>
          <div class="animate-pulse space-y-4">
            <div class="h-24 bg-surface-muted rounded-lg" />
            <div class="h-24 bg-surface-muted rounded-lg" />
          </div>
        </Show>
        <Show when={ordersQuery.isSuccess}>
          <div class="space-y-4">
            <For each={ordersQuery.data as PurchaseOrder[]}>
              {po => (
                <button
                  type="button"
                  class="w-full text-left bg-surface rounded-lg border border-border p-5 hover:border-primary/30 transition-colors"
                  onClick={() => openPo(po)}
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-2">
                        <span class="font-mono text-sm font-semibold text-foreground">
                          {po.poCode}
                        </span>
                        <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                          {po.status}
                        </span>
                      </div>
                      <h3 class="text-base font-semibold text-foreground">{po.supplier}</h3>
                      <div class="flex items-center gap-4 text-sm text-muted mt-1">
                        <span>Batch: {po.batchName}</span>
                        <span>Est: {formatDate(po.estimatedDelivery)}</span>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="text-lg font-bold text-foreground">
                        {formatCurrency(Number(po.totalAmount))}
                      </p>
                      <p class="text-xs text-muted">{po.items.length} items</p>
                    </div>
                  </div>
                </button>
              )}
            </For>

            {((ordersQuery.data as PurchaseOrder[]) || []).length === 0 && (
              <div class="text-center py-12 bg-surface rounded-lg border border-border">
                <Icons.fileText class="w-12 h-12 text-muted mx-auto mb-3" />
                <h3 class="text-base font-semibold text-foreground mb-1">No orders to receive</h3>
                <p class="text-sm text-muted">All purchase orders have been received.</p>
              </div>
            )}
          </div>
        </Show>
      </Show>

      <Show when={selectedPo()}>
        {po => {
          const poItems = () =>
            po().items as Array<{
              id: string
              name: string
              quantity: number
              unit: string
              total: number
            }>
          return (
            <div>
              <nav class="flex items-center gap-2 text-sm mb-6">
                <button
                  type="button"
                  onClick={closePo}
                  class="text-muted hover:text-foreground flex items-center gap-1"
                >
                  <Icons.arrowLeft class="w-4 h-4" /> All Orders
                </button>
                <span class="text-muted">/</span>
                <span class="text-foreground font-medium">{po().poCode}</span>
              </nav>

              <div class="bg-surface rounded-lg border border-border p-5">
                <div class="flex items-start justify-between mb-4">
                  <div>
                    <h2 class="text-lg font-semibold text-foreground">{po().supplier}</h2>
                    <p class="text-sm text-muted mt-1">
                      PO: {po().poCode} | Batch: {po().batchName}
                    </p>
                  </div>
                  <p class="text-lg font-bold text-foreground">
                    {formatCurrency(Number(po().totalAmount))}
                  </p>
                </div>

                <div class="border border-border rounded-lg overflow-hidden">
                  <table class="w-full">
                    <thead class="bg-surface-muted">
                      <tr>
                        <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase">
                          Item
                        </th>
                        <th class="text-center px-4 py-3 text-xs font-semibold text-muted uppercase">
                          Ordered
                        </th>
                        <th class="text-center px-4 py-3 text-xs font-semibold text-muted uppercase">
                          Received
                        </th>
                        <th class="text-center px-4 py-3 text-xs font-semibold text-muted uppercase">
                          Remaining
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={poItems()}>
                        {item => {
                          const received = () => receivedItems()[item.id]?.quantityReceived ?? 0
                          const remaining = () => item.quantity - received()
                          return (
                            <tr class="border-t border-border">
                              <td class="px-4 py-3 text-sm font-medium text-foreground">
                                {item.name}
                              </td>
                              <td class="px-4 py-3 text-center text-sm text-muted">
                                {item.quantity} {item.unit}
                              </td>
                              <td class="px-4 py-3">
                                <div class="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateReceivedQty(item.id, item.quantity)}
                                    class="px-2.5 py-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded transition-colors"
                                  >
                                    All
                                  </button>
                                  <input
                                    type="number"
                                    value={received()}
                                    min={0}
                                    max={item.quantity}
                                    onInput={e =>
                                      updateReceivedQty(
                                        item.id,
                                        Math.min(
                                          item.quantity,
                                          parseInt(e.currentTarget.value, 10) || 0
                                        )
                                      )
                                    }
                                    class="w-20 px-2 py-1.5 border border-border rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateReceivedQty(item.id, 0)}
                                    class="px-2 py-1 text-xs text-muted hover:text-foreground hover:bg-surface-muted rounded transition-colors"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </td>
                              <td class="px-4 py-3 text-center text-sm">
                                <span
                                  class={
                                    remaining() === 0
                                      ? "inline-flex items-center gap-1 text-green-600 font-medium"
                                      : "text-muted"
                                  }
                                >
                                  {remaining() === 0 && <Icons.check class="w-3.5 h-3.5" />}
                                  {remaining()} {item.unit}
                                </span>
                              </td>
                            </tr>
                          )
                        }}
                      </For>
                    </tbody>
                  </table>
                </div>

                <div class="flex items-center justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closePo}
                    class="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteReceipt}
                    disabled={!hasReceivedItems() || receiveMutation.isPending}
                    class={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${hasReceivedItems() && !receiveMutation.isPending ? "bg-primary hover:bg-primary/90" : "bg-muted cursor-not-allowed"}`}
                  >
                    {receiveMutation.isPending
                      ? "Processing..."
                      : `Complete Receipt${totalReceived() > 0 ? ` (${totalReceived()} items)` : ""}`}
                  </button>
                </div>
              </div>
            </div>
          )
        }}
      </Show>
    </div>
  )
}
