import { useCurrentUser } from "@ark/api-client"
import { categoryToneClass, PageHeader, StatCard, THead, Th } from "@ark/ui"
import {
  type StockListResponse,
  useAdjustStock,
  usePaginatedMovements,
  usePaginatedStock,
} from "@data/hooks"
import type { StockItem } from "@data/types"
import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { AdjustStockModal } from "@/components/adjust-stock-modal"
import { Icons, QueryBoundary, StatusBadge } from "@/components/ui"
import { ViewItemModal } from "@/components/view-item-modal"

export default function Page() {
  const adjustMutation = useAdjustStock()
  const userQuery = useCurrentUser()
  const [page, setPage] = createSignal(1)
  const PAGE_SIZE = 20

  const [adjustModalOpen, setAdjustModalOpen] = createSignal(false)
  const [viewModalOpen, setViewModalOpen] = createSignal(false)
  const [selectedItem, setSelectedItem] = createSignal<StockItem | null>(null)
  const [searchQuery, setSearchQuery] = createSignal("")

  const stockQuery = usePaginatedStock(() => ({
    page: page(),
    limit: PAGE_SIZE,
    search: searchQuery().trim() || undefined,
  }))
  const movementsQuery = usePaginatedMovements(() => ({ page: 1, limit: 1 }))
  const rows = createMemo(() => stockQuery.data?.items ?? [])
  const totalPages = createMemo(() =>
    stockQuery.data ? Math.max(1, Math.ceil(stockQuery.data.total / stockQuery.data.limit)) : 1
  )

  const stats = createMemo(() => {
    const byStatus = stockQuery.data?.summary.byStatus ?? {}
    return {
      total: stockQuery.data?.total ?? 0,
      lowStock: byStatus["low-stock"] ?? 0,
      outOfStock: byStatus["out-of-stock"] ?? 0,
      totalMovements: movementsQuery.data?.total ?? 0,
    }
  })
  const canWriteStock = () =>
    userQuery.data?.role === "admin" || userQuery.data?.role === "director"

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

  createEffect(() => {
    searchQuery()
    setPage(1)
  })

  createEffect(() => {
    const lastPage = totalPages()
    if (page() > lastPage) setPage(lastPage)
  })

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <PageHeader
        title="Stock Overview"
        subtitle="Track inventory levels across all batches"
        action={
          <Show when={canWriteStock()}>
            <a
              href="/receiving"
              class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Icons.plus class="w-4 h-4" /> New Receipt
            </a>
          </Show>
        }
      />

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Items"
          value={stockQuery.isSuccess ? stats().total : "-"}
          icon={<Icons.package class="w-6 h-6" />}
          iconClass="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Low Stock"
          value={stockQuery.isSuccess ? stats().lowStock : "-"}
          icon={<Icons.fileText class="w-6 h-6" />}
          iconClass="bg-yellow-50 text-yellow-600"
        />
        <StatCard
          label="Out of Stock"
          value={stockQuery.isSuccess ? stats().outOfStock : "-"}
          icon={<Icons.xCircle class="w-6 h-6" />}
          iconClass="bg-red-50 text-red-600"
        />
        <StatCard
          label="Total Movements"
          value={movementsQuery.isSuccess ? stats().totalMovements : "-"}
          icon={<Icons.box class="w-6 h-6" />}
          iconClass="bg-purple-50 text-purple-600"
        />
      </div>

      <QueryBoundary query={stockQuery}>
        {(_data: StockListResponse) => (
          <div class="bg-surface rounded-lg border border-border overflow-hidden">
            <div class="px-6 py-4 border-b border-border">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-foreground">Current Stock</h2>
                <div class="relative">
                  <Icons.search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery()}
                    onInput={e => setSearchQuery(e.currentTarget.value)}
                    class="pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
                  />
                </div>
              </div>
            </div>
            <table class="w-full">
              <THead>
                <Th size="dense">Item</Th>
                <Th size="dense">Batch</Th>
                <Th size="dense">On Hand</Th>
                <Th size="dense">Status</Th>
                <Th size="dense" align="right">
                  Actions
                </Th>
              </THead>
              <tbody class="divide-y divide-border">
                <For each={rows()}>
                  {(item: StockItem) => (
                    <tr class="hover:bg-surface-muted transition-colors">
                      <td class="px-6 py-4">
                        <p class="text-sm font-medium text-foreground">{item.name}</p>
                        <span
                          class={`inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${categoryToneClass(item.category)}`}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-foreground">{item.batchCode}</span>
                        <p class="text-xs text-muted mt-0.5">{item.batchName}</p>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm font-medium text-foreground">
                          {item.quantityOnHand} {item.unit}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                          <Show when={canWriteStock()}>
                            <button
                              type="button"
                              onClick={() => openAdjustModal(item)}
                              class="text-sm text-muted hover:text-primary font-medium"
                            >
                              Adjust
                            </button>
                            <span class="text-muted">|</span>
                          </Show>
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
            <Show when={stockQuery.data && stockQuery.data.total > stockQuery.data.limit}>
              <div class="flex items-center justify-between border-t border-border px-6 py-4 text-sm text-muted">
                <span>
                  Page {page()} of {totalPages()} · {stockQuery.data?.total ?? 0} items
                </span>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page() <= 1 || stockQuery.isFetching}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    class="rounded-lg border border-border px-3 py-1.5 font-medium text-foreground disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page() >= totalPages() || stockQuery.isFetching}
                    onClick={() => setPage(p => Math.min(totalPages(), p + 1))}
                    class="rounded-lg border border-border px-3 py-1.5 font-medium text-foreground disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </Show>
          </div>
        )}
      </QueryBoundary>

      <ViewItemModal
        open={viewModalOpen()}
        onClose={() => setViewModalOpen(false)}
        item={selectedItem()}
        onAdjust={
          canWriteStock()
            ? () => {
                setViewModalOpen(false)
                const item = selectedItem()
                if (item) openAdjustModal(item)
              }
            : undefined
        }
      />

      <AdjustStockModal
        open={adjustModalOpen()}
        onClose={() => setAdjustModalOpen(false)}
        item={selectedItem()}
        pending={adjustMutation.isPending}
        onSubmit={handleAdjustSubmit}
      />
    </div>
  )
}
