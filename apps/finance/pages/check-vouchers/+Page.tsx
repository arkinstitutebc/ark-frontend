import {
  DataTable,
  formatDatePH,
  formatPeso,
  Icons,
  PageHeader,
  Select,
  StatCard,
  THead,
  Th,
  Tr,
} from "@ark/ui"
import { useBanks, useDisbursements } from "@data/hooks"
import type { Transaction } from "@data/types"
import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { categoryLabel } from "@/components/finance"
import { QueryBoundary } from "@/components/ui"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"
const PAGE_SIZE = 20

function voucherNo(txn: Transaction) {
  return `CV-${new Date(txn.createdAt).getFullYear()}-${txn.id.slice(0, 6).toUpperCase()}`
}

function bankLabel(bank?: { name: string; bankName: string }) {
  if (!bank) return "Bank / Cash"
  return bank.bankName || bank.name
}

export default function CheckVouchersPage() {
  const [search, setSearch] = createSignal("")
  const [page, setPage] = createSignal(1)
  const [sortDir, setSortDir] = createSignal<"asc" | "desc">("desc")
  const vouchersQuery = useDisbursements(() => ({
    page: page(),
    limit: PAGE_SIZE,
    search: search().trim() || undefined,
    sortKey: "date",
    sortDir: sortDir(),
  }))
  const banksQuery = useBanks()

  const banksById = createMemo(() => {
    const entries = banksQuery.data?.map(bank => [bank.id, bank] as const) ?? []
    return new Map(entries)
  })
  const totalAmount = createMemo(() => vouchersQuery.data?.totalAmount ?? 0)
  const hasSearch = createMemo(() => search().trim().length > 0)

  createEffect(() => {
    search()
    sortDir()
    setPage(1)
  })
  createEffect(() => {
    const data = vouchersQuery.data
    if (!data) return
    const lastPage = Math.max(1, Math.ceil(data.total / PAGE_SIZE))
    if (page() > lastPage) setPage(lastPage)
  })

  return (
    <div class="mx-auto max-w-[1600px] px-6 py-8 sm:px-8 lg:px-12">
      <PageHeader
        title="Check Vouchers"
        subtitle="Printable payment vouchers with debit and credit lines"
      />

      <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Vouchers" numeric value={vouchersQuery.data?.total ?? "-"} />
        <StatCard label="Total Amount" numeric value={formatPeso(totalAmount())} />
        <StatCard label="Source" value="Disbursements" />
      </div>

      <QueryBoundary query={vouchersQuery}>
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
            <section class="overflow-hidden rounded-lg border border-border bg-surface">
              <div class="space-y-3 border-b border-border px-5 py-4">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 class="text-sm font-semibold text-foreground">Voucher Register</h2>
                    <p class="mt-1 text-xs text-muted">
                      Generated from recorded finance disbursements.
                    </p>
                  </div>
                  <div class="grid gap-3 sm:grid-cols-[280px_150px]">
                    <input
                      type="search"
                      value={search()}
                      onInput={e => setSearch(e.currentTarget.value)}
                      placeholder="Search voucher, payee, reference"
                      class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Select
                      value={sortDir()}
                      onChange={value => setSortDir(value as "asc" | "desc")}
                      options={[
                        { label: "Newest first", value: "desc" },
                        { label: "Oldest first", value: "asc" },
                      ]}
                      ariaLabel="Voucher sort order"
                    />
                  </div>
                </div>
              </div>

              <Show
                when={data.total > 0}
                fallback={
                  <div class="py-12 text-center">
                    <Icons.fileText class="mx-auto mb-3 h-12 w-12 text-muted" />
                    <p class="text-sm font-medium text-foreground">
                      {hasSearch() ? "No matching check vouchers" : "No check vouchers yet"}
                    </p>
                  </div>
                }
              >
                <DataTable class="max-h-[600px] overflow-auto">
                  <THead>
                    <Th class="min-w-[150px] sticky top-0 z-10 bg-surface-muted">Voucher</Th>
                    <Th class="min-w-[120px] sticky top-0 z-10 bg-surface-muted">Date</Th>
                    <Th class="min-w-[190px] sticky top-0 z-10 bg-surface-muted">Payee</Th>
                    <Th class="min-w-[280px] sticky top-0 z-10 bg-surface-muted">Particular</Th>
                    <Th class="min-w-[220px] sticky top-0 z-10 bg-surface-muted">Debit</Th>
                    <Th class="min-w-[190px] sticky top-0 z-10 bg-surface-muted">Credit</Th>
                    <Th class="min-w-[140px] sticky top-0 z-10 bg-surface-muted">Reference</Th>
                    <Th align="right" class="min-w-[140px] sticky top-0 z-10 bg-surface-muted">
                      Amount
                    </Th>
                    <Th align="right" class="min-w-[120px] sticky top-0 z-10 bg-surface-muted">
                      PDF
                    </Th>
                  </THead>
                  <tbody>
                    <For each={rows()}>
                      {txn => {
                        const credit = createMemo(() => bankLabel(banksById().get(txn.bankId)))
                        return (
                          <Tr>
                            <td class="px-6 py-3 text-sm font-semibold text-foreground whitespace-nowrap">
                              {voucherNo(txn)}
                            </td>
                            <td class="px-6 py-3 text-sm text-muted whitespace-nowrap">
                              {formatDatePH(txn.transactionDate ?? txn.createdAt)}
                            </td>
                            <td class="px-6 py-3 text-sm text-foreground">{txn.payee ?? "-"}</td>
                            <td class="px-6 py-3 text-sm text-foreground">
                              <span class="block max-w-[320px] truncate" title={txn.description}>
                                {txn.description}
                              </span>
                            </td>
                            <td class="px-6 py-3 text-sm text-foreground">
                              <span class="block font-medium">{categoryLabel(txn.category)}</span>
                              <span class="text-xs text-muted">
                                {txn.profitCenter ?? "Unassigned"}
                              </span>
                            </td>
                            <td class="px-6 py-3 text-sm text-foreground">{credit()}</td>
                            <td class="px-6 py-3 text-sm text-muted whitespace-nowrap">
                              {txn.referenceId ?? "-"}
                            </td>
                            <td class="px-6 py-3 text-right text-sm font-semibold text-foreground tabular-nums whitespace-nowrap">
                              {formatPeso(Math.abs(Number(txn.amount)))}
                            </td>
                            <td class="px-6 py-3 text-right">
                              <a
                                href={`${API_URL}/api/finance/check-vouchers/${txn.id}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                                class="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                              >
                                <Icons.fileText class="h-4 w-4" />
                                Open
                              </a>
                            </td>
                          </Tr>
                        )
                      }}
                    </For>
                  </tbody>
                </DataTable>

                <div class="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
                  <p class="text-xs text-muted">
                    Showing {showingFrom()}-{showingTo()} of {data.total}
                  </p>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page() <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      class="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
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
                      class="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next 20
                    </button>
                  </div>
                </div>
              </Show>
            </section>
          )
        }}
      </QueryBoundary>
    </div>
  )
}
