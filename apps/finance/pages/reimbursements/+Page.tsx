import type { Reimbursement } from "@ark/data-types"
import { Button, formatPeso, Input, PageContainer, PageHeader, StatCard } from "@ark/ui"
import { useReimbursements } from "@data/hooks"
import { createMemo, createSignal, For, Show } from "solid-js"
import { navigate } from "vike/client/router"
import {
  filterReimbursements,
  type ReimbursementFilter,
  type ReimbursementSortDir,
  type ReimbursementSortKey,
  reimbursementStats,
  reimbursementStatusFilters,
  sortReimbursements,
} from "@/components/finance/reimbursement-list-helpers"
import { ReimbursementTable } from "@/components/finance/reimbursement-table"

export default function ReimbursementsPage() {
  const query = useReimbursements()
  const [filter, setFilter] = createSignal<ReimbursementFilter>("all")
  const [search, setSearch] = createSignal("")
  const [sortKey, setSortKey] = createSignal<ReimbursementSortKey>("filed")
  const [sortDir, setSortDir] = createSignal<ReimbursementSortDir>("desc")

  const allRows = createMemo(() => (query.data ?? []) as Reimbursement[])
  const stats = createMemo(() => reimbursementStats(allRows()))
  const rows = createMemo(() => {
    const filtered = filterReimbursements(allRows(), filter(), search())
    return sortReimbursements(filtered, sortKey(), sortDir())
  })
  const hasActiveFilters = createMemo(() => filter() !== "all" || search().trim().length > 0)
  const setSort = (key: ReimbursementSortKey) => {
    if (sortKey() === key) {
      setSortDir(sortDir() === "asc" ? "desc" : "asc")
      return
    }
    setSortKey(key)
    setSortDir(key === "amount" ? "desc" : "asc")
  }

  return (
    <PageContainer>
      <PageHeader
        title="Reimbursements"
        subtitle="Staff out-of-pocket expense claims"
        action={
          <a
            href="/reimbursements/create"
            class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            + New Claim
          </a>
        }
      />

      <div class="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <StatCard label="Total claims" value={query.isSuccess ? stats().total : "-"} />
        <StatCard label="Pending" value={query.isSuccess ? stats().pending : "-"} />
        <StatCard label="Approved" value={query.isSuccess ? stats().approved : "-"} />
        <StatCard
          label="Total claimed"
          value={query.isSuccess ? formatPeso(stats().totalAmount) : "-"}
        />
      </div>

      <div class="bg-surface rounded-lg border border-border overflow-hidden">
        <div class="space-y-3 border-b border-border px-5 py-4">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-sm font-semibold text-foreground">Claim History</h2>
            <p class="text-xs text-muted">
              {rows().length} of {allRows().length} claims
            </p>
          </div>
          <div class="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              type="search"
              value={search()}
              onInput={event => setSearch(event.currentTarget.value)}
              placeholder="Search RR #, claimant, activity, partner, or fund"
            />
            <div class="flex flex-wrap gap-2">
              <For each={reimbursementStatusFilters}>
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
        </div>
        <Show
          when={rows().length > 0}
          fallback={
            <div class="py-16 text-center">
              <p class="text-sm font-medium text-foreground">
                {hasActiveFilters()
                  ? "No matching reimbursement claims"
                  : "No reimbursement claims"}
              </p>
              <p class="text-sm text-muted mt-1">
                {hasActiveFilters()
                  ? "Adjust the search or status filter."
                  : "Submit one with + New Claim."}
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
      </div>
    </PageContainer>
  )
}
