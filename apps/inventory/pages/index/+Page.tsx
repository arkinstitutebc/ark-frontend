import { useAdjustStock, useMovements, useStock } from "@data/hooks"
import type { StockItem } from "@data/types"
import { createMemo, createSignal, For } from "solid-js"
import { AdjustStockModal } from "@/components/adjust-stock-modal"
import { Icons, QueryBoundary, StockStatusBadge } from "@/components/ui"
import { ViewItemModal } from "@/components/view-item-modal"

export default function Page() {
  const stockQuery = useStock()
  const movementsQuery = useMovements()
  const adjustMutation = useAdjustStock()

  const [adjustModalOpen, setAdjustModalOpen] = createSignal(false)
  const [viewModalOpen, setViewModalOpen] = createSignal(false)
  const [selectedItem, setSelectedItem] = createSignal<StockItem | null>(null)
  const [searchQuery, setSearchQuery] = createSignal("")

  const filteredStock = createMemo(() => {
    const items = stockQuery.data || []
    const q = searchQuery().toLowerCase().trim()
    if (!q) return items
    return items.filter(
      item => item.name.toLowerCase().includes(q) || item.batchCode?.toLowerCase().includes(q)
    )
  })

  const stats = createMemo(() => {
    const items = stockQuery.data || []
    return {
      total: items.length,
      lowStock: items.filter(i => i.status === "low-stock").length,
      outOfStock: items.filter(i => i.status === "out-of-stock").length,
      totalMovements: movementsQuery.data?.length ?? 0,
    }
  })

  const openAdjustModal = (item: StockItem) => {
    setSelectedItem(item)
    setAdjustModalOpen(true)
  }

  const openViewModal = (item: StockItem) => {
    setSelectedItem(item)
    setViewModalOpen(true)
  }

  const handleAdjustSubmit = (adjustment: { quantity: number; reason: string; notes: string }) => {
    const item = selectedItem()
    if (!item) return
    adjustMutation.mutate(
      { id: item.id, ...adjustment },
      {
        onSuccess: () => setAdjustModalOpen(false),
      }
    )
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Stock Overview</h1>
          <p class="text-sm text-gray-500 mt-1">Track inventory levels across all batches</p>
        </div>
        <a
          href="/receiving"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Icons.plus class="w-4 h-4" /> New Receipt
        </a>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Total Items</p>
              <p class="text-2xl text-gray-900 mt-1">
                {stockQuery.isSuccess ? stats().total : "-"}
              </p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Icons.package class="w-6 h-6" />
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Low Stock</p>
              <p class="text-2xl text-gray-900 mt-1">
                {stockQuery.isSuccess ? stats().lowStock : "-"}
              </p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
              <Icons.fileText class="w-6 h-6" />
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Out of Stock</p>
              <p class="text-2xl text-gray-900 mt-1">
                {stockQuery.isSuccess ? stats().outOfStock : "-"}
              </p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Icons.xCircle class="w-6 h-6" />
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Total Movements</p>
              <p class="text-2xl text-gray-900 mt-1">
                {movementsQuery.isSuccess ? stats().totalMovements : "-"}
              </p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Icons.box class="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <QueryBoundary query={stockQuery}>
        {(_items: StockItem[]) => (
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-gray-900">Current Stock</h2>
                <div class="relative">
                  <Icons.search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery()}
                    onInput={e => setSearchQuery(e.currentTarget.value)}
                    class="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
                  />
                </div>
              </div>
            </div>
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Batch
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    On Hand
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <For each={filteredStock()}>
                  {(item: StockItem) => (
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="px-6 py-4">
                        <p class="text-sm font-medium text-gray-900">{item.name}</p>
                        <p class="text-xs text-gray-500 mt-0.5">{item.category}</p>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-700">{item.batchCode}</span>
                        <p class="text-xs text-gray-500 mt-0.5">{item.batchName}</p>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm font-medium text-gray-900">
                          {item.quantityOnHand} {item.unit}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <StockStatusBadge status={item.status} />
                      </td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openAdjustModal(item)}
                            class="text-sm text-gray-600 hover:text-primary font-medium"
                          >
                            Adjust
                          </button>
                          <span class="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={() => openViewModal(item)}
                            class="text-sm text-primary hover:text-primary/80 font-medium"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        )}
      </QueryBoundary>

      <ViewItemModal
        open={viewModalOpen()}
        onClose={() => setViewModalOpen(false)}
        item={selectedItem()}
        onAdjust={() => {
          setViewModalOpen(false)
          if (selectedItem()) openAdjustModal(selectedItem()!)
        }}
      />

      <AdjustStockModal
        open={adjustModalOpen()}
        onClose={() => setAdjustModalOpen(false)}
        item={selectedItem()}
        onSubmit={handleAdjustSubmit}
      />
    </div>
  )
}
