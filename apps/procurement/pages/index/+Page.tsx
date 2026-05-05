import { useRequests } from "@data/hooks"
import type { PrStatus, PurchaseRequest } from "@data/types"
import { createMemo, createSignal, For, Show } from "solid-js"
import { PrDocumentModal } from "@/components/pr-document-modal"
import { Icons, PrStatusBadge, QueryBoundary } from "@/components/ui"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount)
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr))
}

export default function Page() {
  const query = useRequests()
  const [filter, setFilter] = createSignal<PrStatus | "all">("all")
  const [search, setSearch] = createSignal("")
  const [selectedPr, setSelectedPr] = createSignal<PurchaseRequest | null>(null)
  const [modalOpen, setModalOpen] = createSignal(false)

  const filteredRequests = createMemo(() => {
    const data = query.data || []
    return data.filter(r => {
      const matchStatus = filter() === "all" || r.status === filter()
      const matchSearch =
        !search() ||
        r.prCode?.toLowerCase().includes(search().toLowerCase()) ||
        r.batchName?.toLowerCase().includes(search().toLowerCase()) ||
        r.category?.toLowerCase().includes(search().toLowerCase())
      return matchStatus && matchSearch
    })
  })

  const stats = createMemo(() => {
    const data = query.data || []
    return {
      total: data.length,
      pending: data.filter(r => r.status === "pending").length,
      approved: data.filter(r => r.status === "approved").length,
      ordered: data.filter(r => r.status === "ordered").length,
    }
  })

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-semibold text-foreground">Purchase Requests</h1>
          <p class="text-sm text-muted mt-1">Manage procurement requests and approvals</p>
        </div>
        <a
          href="/pr/create"
          class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          + Create PR
        </a>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted mb-1">Total</p>
          <p class="text-2xl text-foreground">{query.isSuccess ? stats().total : "-"}</p>
        </div>
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted mb-1">Pending</p>
          <p class="text-2xl text-foreground">{query.isSuccess ? stats().pending : "-"}</p>
        </div>
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted mb-1">Approved</p>
          <p class="text-2xl text-foreground">{query.isSuccess ? stats().approved : "-"}</p>
        </div>
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted mb-1">Ordered</p>
          <p class="text-2xl text-foreground">{query.isSuccess ? stats().ordered : "-"}</p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <div class="relative flex-1">
          <Icons.search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by PR #, batch, or category..."
            value={search()}
            onInput={e => setSearch(e.currentTarget.value)}
            class="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div class="flex gap-2">
          <For
            each={[
              { value: "all" as const, label: "All" },
              { value: "pending" as const, label: "Pending" },
              { value: "approved" as const, label: "Approved" },
              { value: "ordered" as const, label: "Ordered" },
            ]}
          >
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

      <QueryBoundary query={query}>
        {(_data: PurchaseRequest[]) => (
          <div class="bg-surface rounded-lg border border-border overflow-hidden">
            <Show
              when={filteredRequests().length > 0}
              fallback={
                <div class="py-16 text-center">
                  <Icons.fileText class="w-12 h-12 mx-auto mb-3 text-muted" />
                  <p class="text-sm font-medium text-foreground">No purchase requests found</p>
                </div>
              }
            >
              <table class="w-full">
                <thead class="bg-surface-muted border-b border-border">
                  <tr>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      PR Code
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      Batch
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      Category
                    </th>
                    <th class="py-4 px-6 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                      Amount
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      Created
                    </th>
                    <th class="py-4 px-6 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={filteredRequests()}>
                    {(pr: PurchaseRequest) => (
                      <tr
                        onClick={() => (window.location.href = `/pr/${pr.id}`)}
                        class="border-t border-border hover:bg-surface-muted cursor-pointer transition-colors"
                      >
                        <td class="py-4 px-6">
                          <span class="font-mono text-sm font-medium text-foreground">
                            {pr.prCode}
                          </span>
                        </td>
                        <td class="py-4 px-6">
                          <p class="text-sm text-foreground">{pr.batchName}</p>
                          <p class="text-xs text-muted">{pr.batchCode}</p>
                        </td>
                        <td class="py-4 px-6 text-sm text-foreground">{pr.category}</td>
                        <td class="py-4 px-6 text-right text-sm text-foreground">
                          {formatCurrency(Number(pr.totalAmount))}
                        </td>
                        <td class="py-4 px-6">
                          <PrStatusBadge status={pr.status} />
                        </td>
                        <td class="py-4 px-6 text-sm text-muted">{formatDate(pr.createdAt)}</td>
                        <td class="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              setSelectedPr(pr)
                              setModalOpen(true)
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

      <PrDocumentModal open={modalOpen()} onClose={() => setModalOpen(false)} pr={selectedPr()} />
    </div>
  )
}
