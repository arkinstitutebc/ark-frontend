import { useOrders } from "@data/hooks"
import type { PoStatus, PurchaseOrder } from "@data/types"
import { createMemo, createSignal, For, Show } from "solid-js"
import { PoDocumentModal } from "@/components/po-document-modal"
import { Icons, PoStatusBadge, QueryBoundary } from "@/components/ui"

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

function getEmptyStateMessage(filter: PoStatus | "all") {
  switch (filter) {
    case "draft":
      return { title: "No draft orders", message: "No purchase orders in draft status." }
    case "sent":
      return { title: "No sent orders", message: "No orders have been sent to suppliers." }
    case "received":
      return { title: "No received orders", message: "No orders have been received yet." }
    default:
      return { title: "No purchase orders", message: "Create a purchase order to get started." }
  }
}

export default function OrdersPage() {
  const query = useOrders()
  const [filter, setFilter] = createSignal<PoStatus | "all">("all")
  const [search, setSearch] = createSignal("")
  const [selectedPo, setSelectedPo] = createSignal<PurchaseOrder | null>(null)
  const [modalOpen, setModalOpen] = createSignal(false)

  const handleViewPo = (po: PurchaseOrder) => {
    setSelectedPo(po)
    setModalOpen(true)
  }

  const filteredOrders = createMemo(() => {
    const data = query.data || []
    return data.filter(po => {
      const matchStatus = filter() === "all" || po.status === filter()
      const matchSearch =
        !search() ||
        po.poCode?.toLowerCase().includes(search().toLowerCase()) ||
        po.batchName?.toLowerCase().includes(search().toLowerCase()) ||
        po.supplier?.toLowerCase().includes(search().toLowerCase())
      return matchStatus && matchSearch
    })
  })

  const stats = createMemo(() => {
    const data = query.data || []
    return {
      total: data.length,
      draft: data.filter(po => po.status === "draft").length,
      sent: data.filter(po => po.status === "sent").length,
      received: data.filter(po => po.status === "received").length,
    }
  })

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Purchase Orders</h1>
          <p class="text-sm text-gray-500 mt-1">Manage supplier orders and delivery tracking</p>
        </div>
        <a
          href="/orders/create"
          class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          + Create PO
        </a>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500 mb-1">Total</p>
          <p class="text-2xl text-gray-900">{query.isSuccess ? stats().total : "-"}</p>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500 mb-1">Draft</p>
          <p class="text-2xl text-gray-900">{query.isSuccess ? stats().draft : "-"}</p>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500 mb-1">Sent</p>
          <p class="text-2xl text-gray-900">{query.isSuccess ? stats().sent : "-"}</p>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500 mb-1">Received</p>
          <p class="text-2xl text-gray-900">{query.isSuccess ? stats().received : "-"}</p>
        </div>
      </div>

      {/* Filters */}
      <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <div class="relative flex-1">
          <Icons.search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by PO #, batch, or supplier..."
            value={search()}
            onInput={e => setSearch(e.currentTarget.value)}
            class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div class="flex gap-2">
          <For
            each={[
              { value: "all" as const, label: "All" },
              { value: "draft" as const, label: "Draft" },
              { value: "sent" as const, label: "Sent" },
              { value: "received" as const, label: "Received" },
            ]}
          >
            {item => (
              <button
                type="button"
                onClick={() => setFilter(item.value)}
                class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter() === item.value ? "bg-primary text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"}`}
              >
                {item.label}
              </button>
            )}
          </For>
        </div>
      </div>

      {/* Table */}
      <QueryBoundary query={query}>
        {(_data: PurchaseOrder[]) => (
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Show
              when={filteredOrders().length > 0}
              fallback={
                <div class="py-16 text-center">
                  <Icons.shoppingBag class="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p class="text-sm font-medium text-gray-900">
                    {getEmptyStateMessage(filter()).title}
                  </p>
                  <p class="text-sm text-gray-500 mt-1">{getEmptyStateMessage(filter()).message}</p>
                </div>
              }
            >
              <table class="w-full">
                <thead class="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      PO Code
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      PR Ref
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Batch
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th class="py-4 px-6 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Est. Delivery
                    </th>
                    <th class="py-4 px-6 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={filteredOrders()}>
                    {(po: PurchaseOrder) => (
                      <tr
                        onClick={() => (window.location.href = `/orders/${po.id}`)}
                        class="border-t border-gray-100 hover:bg-primary/5 cursor-pointer transition-colors"
                      >
                        <td class="py-4 px-6">
                          <span class="font-mono text-sm font-medium text-gray-900">
                            {po.poCode}
                          </span>
                        </td>
                        <td class="py-4 px-6">
                          <span class="text-sm text-gray-600">{po.prId}</span>
                        </td>
                        <td class="py-4 px-6">
                          <p class="text-sm text-gray-900">{po.batchName}</p>
                        </td>
                        <td class="py-4 px-6">
                          <span class="text-sm text-gray-700">{po.supplier}</span>
                        </td>
                        <td class="py-4 px-6 text-right">
                          <span class="text-sm text-gray-900">
                            {formatCurrency(Number(po.totalAmount))}
                          </span>
                        </td>
                        <td class="py-4 px-6">
                          <PoStatusBadge status={po.status} />
                        </td>
                        <td class="py-4 px-6">
                          <span class="text-sm text-gray-600">
                            {formatDate(po.estimatedDelivery)}
                          </span>
                        </td>
                        <td class="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              handleViewPo(po)
                            }}
                            class="text-primary hover:text-primary/80 text-sm font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </Show>
          </div>
        )}
      </QueryBoundary>

      {/* Document Modal */}
      <PoDocumentModal open={modalOpen()} onClose={() => setModalOpen(false)} po={selectedPo()} />
    </div>
  )
}
