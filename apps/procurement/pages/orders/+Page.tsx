import { formatDatePH, PageContainer, PageHeader, StatCard, THead, Th } from "@ark/ui"
import { usePaginatedOrders } from "@data/hooks"
import type { PurchaseOrderListItem } from "@data/hooks/orders"
import type { PoStatus } from "@data/types"
import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { Icons, QueryBoundary, StatusBadge } from "@/components/ui"

function getEmptyStateMessage(filter: PoStatus | "all") {
  switch (filter) {
    case "pending":
      return { title: "No pending POs", message: "Approved requests automatically appear here." }
    case "confirmed":
      return {
        title: "No confirmed POs",
        message: "No purchase orders are awaiting acknowledgment.",
      }
    case "acknowledged":
      return {
        title: "No acknowledged POs",
        message: "No purchase orders are awaiting liquidation.",
      }
    case "liquidated":
      return {
        title: "No liquidated POs",
        message: "No purchase orders have completed finance review.",
      }
    default:
      return { title: "No purchase orders", message: "Create a purchase order to get started." }
  }
}

export default function OrdersPage() {
  const [filter, setFilter] = createSignal<PoStatus | "all">("all")
  const [search, setSearch] = createSignal("")
  const [page, setPage] = createSignal(1)
  const PAGE_SIZE = 20
  const query = usePaginatedOrders(() => ({
    page: page(),
    limit: PAGE_SIZE,
    status: filter() === "all" ? undefined : filter(),
    search: search().trim() || undefined,
  }))
  const filters = [
    { value: "all" as const, label: "All" },
    { value: "pending" as const, label: "Pending" },
    { value: "confirmed" as const, label: "Confirmed" },
    { value: "acknowledged" as const, label: "Acknowledged" },
    { value: "liquidated" as const, label: "Liquidated" },
  ]

  const rows = createMemo(() => query.data?.items ?? [])
  const totalPages = createMemo(() =>
    query.data ? Math.max(1, Math.ceil(query.data.total / query.data.limit)) : 1
  )

  const stats = createMemo(() => {
    const counts = query.data?.summary.byStatus ?? {}
    return {
      total: Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0),
      pending: counts.pending ?? 0,
      confirmed: counts.confirmed ?? 0,
      acknowledged: counts.acknowledged ?? 0,
      liquidated: counts.liquidated ?? 0,
    }
  })

  createEffect(() => {
    filter()
    search()
    setPage(1)
  })

  createEffect(() => {
    const lastPage = totalPages()
    if (page() > lastPage) setPage(lastPage)
  })

  return (
    <PageContainer>
      <PageHeader
        title="Purchase Orders"
        subtitle="POs are generated automatically when purchase requests are approved"
      />

      {/* Stats Cards */}
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total" value={query.isSuccess ? stats().total : "-"} />
        <StatCard label="Pending" value={query.isSuccess ? stats().pending : "-"} />
        <StatCard label="Confirmed" value={query.isSuccess ? stats().confirmed : "-"} />
        <StatCard label="Acknowledged" value={query.isSuccess ? stats().acknowledged : "-"} />
        <StatCard label="Liquidated" value={query.isSuccess ? stats().liquidated : "-"} />
      </div>

      {/* Filters */}
      <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <div class="relative flex-1">
          <Icons.search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by PO #, batch, or supplier..."
            value={search()}
            onInput={e => setSearch(e.currentTarget.value)}
            class="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div class="flex gap-2">
          <For each={filters}>
            {item => (
              <button
                type="button"
                onClick={() => setFilter(item.value)}
                class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter() === item.value ? "bg-primary text-white" : "bg-surface text-foreground border border-border hover:bg-surface-muted"}`}
              >
                {item.label}
              </button>
            )}
          </For>
        </div>
      </div>

      {/* Table */}
      <QueryBoundary query={query}>
        {data => (
          <div class="bg-surface rounded-lg border border-border overflow-hidden">
            <Show
              when={rows().length > 0}
              fallback={
                <div class="py-16 text-center">
                  <Icons.shoppingBag class="w-12 h-12 mx-auto mb-3 text-muted" />
                  <p class="text-sm font-medium text-foreground">
                    {getEmptyStateMessage(filter()).title}
                  </p>
                  <p class="text-sm text-muted mt-1">{getEmptyStateMessage(filter()).message}</p>
                </div>
              }
            >
              <div class="overflow-x-auto">
                <table class="w-full">
                  <THead>
                    <Th>PO Code</Th>
                    <Th>PR Ref</Th>
                    <Th>Batch</Th>
                    <Th>Supplier</Th>
                    <Th>Status</Th>
                    <Th>Est. Delivery</Th>
                    <Th align="right">Actions</Th>
                  </THead>
                  <tbody>
                    <For each={rows()}>
                      {(po: PurchaseOrderListItem) => (
                        <tr class="border-t border-border">
                          <td class="py-4 px-6">
                            <span class="font-mono text-sm font-medium text-foreground">
                              {po.poCode}
                            </span>
                          </td>
                          <td class="py-4 px-6">
                            <span class="font-mono text-sm text-muted">
                              {po.prCode ?? po.prId.slice(0, 8)}
                            </span>
                          </td>
                          <td class="py-4 px-6">
                            <p class="text-sm text-foreground">{po.batchName}</p>
                          </td>
                          <td class="py-4 px-6">
                            <span class="text-sm text-foreground">{po.supplier}</span>
                          </td>
                          <td class="py-4 px-6">
                            <StatusBadge status={po.status} />
                          </td>
                          <td class="py-4 px-6">
                            <span class="text-sm text-muted">
                              {formatDatePH(po.estimatedDelivery)}
                            </span>
                          </td>
                          <td class="py-4 px-6 text-right">
                            <a
                              href={`/orders/${po.id}`}
                              class="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium"
                            >
                              <Icons.eye class="w-4 h-4" /> Open
                            </a>
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </Show>
            <Show when={data.total > data.limit}>
              <div class="flex items-center justify-between border-t border-border px-6 py-4 text-sm text-muted">
                <span>
                  Page {page()} of {totalPages()} · {data.total} orders
                </span>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page() <= 1 || query.isFetching}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    class="rounded-lg border border-border px-3 py-1.5 font-medium text-foreground disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page() >= totalPages() || query.isFetching}
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
    </PageContainer>
  )
}
