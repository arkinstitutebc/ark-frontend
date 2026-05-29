import { ConfirmDialog, formatPeso, PageHeader, Select, StatCard } from "@ark/ui"
import { categoryOptionsBySection } from "@data/gl-defaults"
import { useBankBalance, useDeleteDisbursement, useDisbursements } from "@data/hooks"
import type { Transaction, TxnCategory } from "@data/types"
import { createEffect, createMemo, createSignal, Show } from "solid-js"
import {
  DisbursementDetailsModal,
  type DisbursementSortDir,
  type DisbursementSortKey,
  DisbursementTable,
} from "@/components/finance"
import { Icons, QueryBoundary } from "@/components/ui"

const PAGE_SIZE = 20

export default function DisbursementsPage() {
  const [search, setSearch] = createSignal("")
  const [categoryFilter, setCategoryFilter] = createSignal<TxnCategory | "all">("all")
  const [reviewFilter, setReviewFilter] = createSignal<"all" | "needs-review">("all")
  const [sortKey, setSortKey] = createSignal<DisbursementSortKey>("date")
  const [sortDir, setSortDir] = createSignal<DisbursementSortDir>("desc")
  const [page, setPage] = createSignal(1)
  const [selectedTxn, setSelectedTxn] = createSignal<Transaction | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = createSignal(false)
  const query = useDisbursements(() => {
    const category = categoryFilter()
    return {
      page: page(),
      limit: PAGE_SIZE,
      search: search().trim() || undefined,
      category: category === "all" ? undefined : category,
      review: reviewFilter() === "all" ? undefined : "needs-review",
      sortKey: sortKey(),
      sortDir: sortDir(),
    }
  })
  const opsBalance = useBankBalance(() => "operational-hub")
  const deleteDisbursement = useDeleteDisbursement()

  const totalExpenses = createMemo(() => {
    if (!query.data) return null
    return query.data.totalAmount
  })
  const categoryOptions = createMemo(() => [
    { label: "All categories", value: "all" as const },
    ...categoryOptionsBySection().flatMap(section => section.options),
  ])
  const reviewOptions = [
    { label: "All records", value: "all" as const },
    { label: "Needs review", value: "needs-review" as const },
  ]
  const hasActiveFilters = createMemo(
    () => search().trim().length > 0 || categoryFilter() !== "all" || reviewFilter() !== "all"
  )
  createEffect(() => {
    search()
    categoryFilter()
    reviewFilter()
    sortKey()
    sortDir()
    setPage(1)
  })
  createEffect(() => {
    const data = query.data
    if (!data) return
    const lastPage = Math.max(1, Math.ceil(data.total / PAGE_SIZE))
    if (page() > lastPage) setPage(lastPage)
  })
  const setSort = (key: DisbursementSortKey) => {
    if (sortKey() === key) {
      setSortDir(sortDir() === "asc" ? "desc" : "asc")
      return
    }
    setSortKey(key)
    setSortDir(key === "amount" ? "desc" : "asc")
  }
  const canMutate = (txn: Transaction) =>
    txn.type === "expense" && !["payroll", "reimbursement"].includes(txn.referenceType ?? "")
  const requestDelete = (txn: Transaction) => {
    setSelectedTxn(txn)
    setConfirmDeleteOpen(true)
  }
  const confirmDelete = () => {
    const txn = selectedTxn()
    if (!txn) return
    deleteDisbursement.mutate(txn.id, {
      onSuccess: () => {
        setConfirmDeleteOpen(false)
        setSelectedTxn(null)
      },
    })
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-[1600px] mx-auto">
      <PageHeader
        title="Disbursements"
        subtitle="Cash disbursements and operational expenses"
        action={
          <a
            href="/disbursements/create"
            class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            + New Disbursement
          </a>
        }
      />

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Disbursements" numeric value={query.data?.total ?? "-"} />
        <StatCard
          label="Total Expenses"
          numeric
          value={(() => {
            const v = totalExpenses()
            return v !== null ? formatPeso(v) : "-"
          })()}
        />
        <StatCard
          label="Operational Hub Balance"
          numeric
          value={opsBalance.data ? formatPeso(opsBalance.data.balance) : "-"}
        />
      </div>

      <QueryBoundary query={query}>
        {data => {
          const rows = createMemo(() => data.items.slice(0, PAGE_SIZE))
          const totalPages = createMemo(() => Math.max(1, Math.ceil(data.total / PAGE_SIZE)))
          const showingFrom = createMemo(() =>
            data.total === 0 ? 0 : (page() - 1) * PAGE_SIZE + 1
          )
          const showingTo = createMemo(() =>
            Math.min((page() - 1) * PAGE_SIZE + rows().length, data.total)
          )
          return (
            <div class="bg-surface rounded-lg border border-border overflow-hidden">
              <div class="px-5 py-4 border-b border-border space-y-3">
                <div class="flex items-center justify-between gap-3">
                  <h2 class="text-sm font-semibold text-foreground">Expense History</h2>
                  <p class="text-xs text-muted">{data.total} disbursements</p>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-[1fr_220px_180px] gap-3">
                  <input
                    type="search"
                    value={search()}
                    onInput={e => setSearch(e.currentTarget.value)}
                    placeholder="Search store, item, category"
                    class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <Select
                    value={categoryFilter()}
                    onChange={value => setCategoryFilter(value)}
                    options={categoryOptions()}
                    ariaLabel="Category filter"
                  />
                  <Select
                    value={reviewFilter()}
                    onChange={setReviewFilter}
                    options={reviewOptions}
                    ariaLabel="Review filter"
                  />
                </div>
              </div>
              <Show
                when={data.total > 0}
                fallback={
                  <div class="py-12 text-center">
                    <Icons.receipt class="w-12 h-12 mx-auto mb-3 text-muted" />
                    <p class="text-sm font-medium text-foreground">
                      {hasActiveFilters() ? "No matching disbursements" : "No disbursements yet"}
                    </p>
                  </div>
                }
              >
                <Show
                  when={rows().length > 0}
                  fallback={
                    <p class="px-5 py-10 text-sm text-muted text-center">
                      No matching disbursements.
                    </p>
                  }
                >
                  <DisbursementTable
                    rows={rows()}
                    sortKey={sortKey()}
                    sortDir={sortDir()}
                    onSort={setSort}
                    onSelect={setSelectedTxn}
                  />
                  <div class="px-5 py-3 border-t border-border flex items-center justify-between gap-3">
                    <p class="text-xs text-muted">
                      Showing {showingFrom()}-{showingTo()} of {data.total}
                    </p>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={page() <= 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        class="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span class="text-xs text-muted">
                        {page()} / {totalPages()}
                      </span>
                      <button
                        type="button"
                        disabled={page() >= totalPages()}
                        onClick={() => setPage(p => Math.min(totalPages(), p + 1))}
                        class="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next 20
                      </button>
                    </div>
                  </div>
                </Show>
              </Show>
            </div>
          )
        }}
      </QueryBoundary>

      <DisbursementDetailsModal
        txn={selectedTxn()}
        onClose={() => setSelectedTxn(null)}
        onDelete={requestDelete}
        canMutate={canMutate}
      />

      <ConfirmDialog
        open={confirmDeleteOpen()}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Delete disbursement?"
        description="This removes the expense from reports and bank balance. Payroll and reimbursement postings stay protected."
        confirmLabel="Delete"
        danger
        pending={deleteDisbursement.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
