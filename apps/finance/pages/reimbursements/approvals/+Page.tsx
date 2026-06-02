import type { Reimbursement } from "@ark/data-types"
import { Button, PageContainer, PageHeader, StatCard } from "@ark/ui"
import { useReimbursements } from "@data/hooks"
import { createMemo, createSignal, For, Show } from "solid-js"
import { navigate } from "vike/client/router"
import {
  type ReimbursementSortDir,
  type ReimbursementSortKey,
  reimbursementQueueFilters,
  reimbursementStats,
  sortReimbursements,
} from "@/components/finance/reimbursement-list-helpers"
import { ReimbursementTable } from "@/components/finance/reimbursement-table"

export default function RrApprovalsPage() {
  const query = useReimbursements()
  const [filter, setFilter] =
    createSignal<(typeof reimbursementQueueFilters)[number]["value"]>("pending")
  const [sortKey, setSortKey] = createSignal<ReimbursementSortKey>("filed")
  const [sortDir, setSortDir] = createSignal<ReimbursementSortDir>("desc")

  const all = createMemo(() => (query.data ?? []) as Reimbursement[])
  const stats = createMemo(() => reimbursementStats(all()))
  const rows = createMemo(() =>
    sortReimbursements(
      all().filter(rr => rr.status === filter()),
      sortKey(),
      sortDir()
    )
  )
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
            <p class="text-xs text-muted">{rows().length} claims</p>
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
      </div>
    </PageContainer>
  )
}
