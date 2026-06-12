import type { Reimbursement } from "@ark/data-types"
import { Button, PageContainer, PageHeader, QueryBoundary, StatCard, TableSkeleton } from "@ark/ui"
import { usePaginatedReimbursements } from "@data/hooks"
import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { navigate } from "vike/client/router"
import {
  type ReimbursementSortDir,
  type ReimbursementSortKey,
  reimbursementQueueFilters,
} from "@/components/finance/reimbursement-list-helpers"
import { ReimbursementTable } from "@/components/finance/reimbursement-table"

export default function RrApprovalsPage() {
  const [filter, setFilter] =
    createSignal<(typeof reimbursementQueueFilters)[number]["value"]>("pending")
  const [sortKey, setSortKey] = createSignal<ReimbursementSortKey>("filed")
  const [sortDir, setSortDir] = createSignal<ReimbursementSortDir>("desc")
  const [page, setPage] = createSignal(1)
  const PAGE_SIZE = 20

  const query = usePaginatedReimbursements(() => ({
    page: page(),
    limit: PAGE_SIZE,
    status: filter(),
    sortKey: sortKey(),
    sortDir: sortDir(),
  }))
  const rows = createMemo(() => (query.data?.items ?? []) as Reimbursement[])
  const totalPages = createMemo(() =>
    query.data ? Math.max(1, Math.ceil(query.data.total / query.data.limit)) : 1
  )
  const stats = createMemo(() => {
    const byStatus = query.data?.summary.byStatus ?? {}
    return {
      pending: byStatus.pending ?? 0,
      verified: byStatus.verified ?? 0,
      approved: byStatus.approved ?? 0,
      rejected: byStatus.rejected ?? 0,
    }
  })
  const setSort = (key: ReimbursementSortKey) => {
    if (sortKey() === key) {
      setSortDir(sortDir() === "asc" ? "desc" : "asc")
      return
    }
    setSortKey(key)
    setSortDir(key === "amount" ? "desc" : "asc")
  }

  createEffect(() => {
    filter()
    sortKey()
    sortDir()
    setPage(1)
  })

  createEffect(() => {
    const lastPage = totalPages()
    if (page() > lastPage) setPage(lastPage)
  })

  return (
    <PageContainer>
      <PageHeader
        title="Reimbursement Approvals"
        subtitle="Two-stage queue — Finance verifies, Management approves"
      />

      <div class="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
        <StatCard label="Finance queue" value={query.isSuccess ? stats().pending : "-"} />
        <StatCard label="Management queue" value={query.isSuccess ? stats().verified : "-"} />
        <StatCard label="Approved" value={query.isSuccess ? stats().approved : "-"} />
        <StatCard label="Rejected" value={query.isSuccess ? stats().rejected : "-"} />
      </div>

      <div class="bg-surface rounded-lg border border-border overflow-hidden">
        <div class="space-y-3 border-b border-border px-5 py-4">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-sm font-semibold text-foreground">Approval Queue</h2>
            <p class="text-xs text-muted">
              {query.isSuccess
                ? `${rows().length} of ${query.data?.total ?? 0} claims`
                : "Loading claims"}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <For each={reimbursementQueueFilters}>
              {item => (
                <Button
                  type="button"
                  size="sm"
                  variant={filter() === item.value ? "primary" : "secondary"}
                  onClick={() => setFilter(item.value)}
                >
                  {item.label}
                </Button>
              )}
            </For>
          </div>
        </div>
        <QueryBoundary query={query} loadingFallback={<TableSkeleton rows={6} cols={8} />}>
          {() => (
            <Show
              when={rows().length > 0}
              fallback={
                <div class="py-16 text-center">
                  <p class="text-sm font-medium text-foreground">
                    {filter() === "pending" ? "Nothing to verify" : "Nothing to approve"}
                  </p>
                  <p class="text-sm text-muted mt-1">
                    {filter() === "pending"
                      ? "New claims will land here for finance to verify."
                      : "Verified claims await management approval here."}
                  </p>
                </div>
              }
            >
              <ReimbursementTable
                rows={rows()}
                sortKey={sortKey()}
                sortDir={sortDir()}
                onSort={setSort}
                onOpen={id => navigate(`/reimbursements/${id}`)}
              />
            </Show>
          )}
        </QueryBoundary>
        <Show when={query.data && query.data.total > query.data.limit}>
          <div class="flex items-center justify-between border-t border-border px-6 py-4 text-sm text-muted">
            <span>
              Page {page()} of {totalPages()} · {query.data?.total ?? 0} claims
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
    </PageContainer>
  )
}
