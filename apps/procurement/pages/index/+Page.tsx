import {
  categoryToneClass,
  DataTable,
  formatDatePH,
  formatPeso,
  PageContainer,
  PageHeader,
  StatCard,
  THead,
  Th,
} from "@ark/ui"
import { useRequests } from "@data/hooks"
import type { PrStatus, PurchaseRequest } from "@data/types"
import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { navigate } from "vike/client/router"
import { PrDocumentModal } from "@/components/pr-document-modal"
import { Icons, QueryBoundary, StatusBadge } from "@/components/ui"

export default function Page() {
  const [filter, setFilter] = createSignal<PrStatus | "all">("all")
  const [search, setSearch] = createSignal("")
  const [page, setPage] = createSignal(1)
  const [selectedPr, setSelectedPr] = createSignal<PurchaseRequest | null>(null)
  const [modalOpen, setModalOpen] = createSignal(false)
  const query = useRequests(() => ({
    ...(filter() !== "all" ? { status: filter() } : {}),
    page: page(),
    limit: 20,
    search: search().trim() || undefined,
  }))

  const requests = createMemo(() => query.data?.items ?? [])
  const pageCount = createMemo(() =>
    query.data ? Math.max(1, Math.ceil(query.data.total / query.data.limit)) : 1
  )

  createEffect(() => {
    filter()
    search()
    setPage(1)
  })

  const stats = createMemo(() => {
    const byStatus = query.data?.summary.byStatus
    return {
      total: query.data?.total ?? 0,
      pending: byStatus?.pending?.count ?? 0,
      approved: byStatus?.approved?.count ?? 0,
      ordered: byStatus?.ordered?.count ?? 0,
    }
  })

  return (
    <PageContainer>
      <PageHeader
        title="Purchase Requests"
        subtitle="Manage procurement requests and approvals"
        action={
          <a
            href="/pr/create"
            class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            + Create PR
          </a>
        }
      />

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total" value={query.isSuccess ? stats().total : "-"} />
        <StatCard label="Pending" value={query.isSuccess ? stats().pending : "-"} />
        <StatCard label="Approved" value={query.isSuccess ? stats().approved : "-"} />
        <StatCard label="Ordered" value={query.isSuccess ? stats().ordered : "-"} />
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
        {data => (
          <div class="bg-surface rounded-lg border border-border overflow-hidden">
            <Show
              when={requests().length > 0}
              fallback={
                <div class="py-16 text-center">
                  <Icons.fileText class="w-12 h-12 mx-auto mb-3 text-muted" />
                  <p class="text-sm font-medium text-foreground">No purchase requests found</p>
                </div>
              }
            >
              <DataTable>
                <THead>
                  <Th>PR Code</Th>
                  <Th>Batch</Th>
                  <Th>Category</Th>
                  <Th align="right">Amount</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                  <Th align="right">Actions</Th>
                </THead>
                <tbody>
                  <For each={requests()}>
                    {(pr: PurchaseRequest) => (
                      <tr
                        onClick={() => navigate(`/pr/${pr.id}`)}
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
                        <td class="py-4 px-6">
                          <Show
                            when={pr.category}
                            fallback={<span class="text-sm text-muted">—</span>}
                          >
                            <span
                              class={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${categoryToneClass(pr.category)}`}
                            >
                              {pr.category}
                            </span>
                          </Show>
                        </td>
                        <td class="py-4 px-6 text-right text-sm text-foreground">
                          {formatPeso(Number(pr.totalAmount))}
                        </td>
                        <td class="py-4 px-6">
                          <StatusBadge status={pr.status} />
                        </td>
                        <td class="py-4 px-6 text-sm text-muted">{formatDatePH(pr.createdAt)}</td>
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
              </DataTable>
            </Show>
            <Show when={data.total > data.limit}>
              <div class="flex items-center justify-between border-t border-border px-5 py-3">
                <p class="text-xs text-muted">
                  Page {page()} of {pageCount()} · {data.total} requests
                </p>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page() <= 1 || query.isFetching}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    class="px-3 py-1.5 rounded-md border border-border text-xs font-medium text-foreground hover:bg-surface-muted disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page() >= pageCount() || query.isFetching}
                    onClick={() => setPage(p => Math.min(pageCount(), p + 1))}
                    class="px-3 py-1.5 rounded-md border border-border text-xs font-medium text-foreground hover:bg-surface-muted disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </Show>
          </div>
        )}
      </QueryBoundary>

      <PrDocumentModal open={modalOpen()} onClose={() => setModalOpen(false)} pr={selectedPr()} />
    </PageContainer>
  )
}
