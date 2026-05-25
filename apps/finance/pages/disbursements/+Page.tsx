import { DataTable, formatDatePH, formatPeso, PageHeader, StatCard, THead, Th, Tr } from "@ark/ui"
import { GL_CATALOG } from "@data/gl-defaults"
import { useBankBalance, useDisbursements } from "@data/hooks"
import type { Transaction, TxnCategory } from "@data/types"
import { createMemo, createSignal, For, Show } from "solid-js"
import { Icons, QueryBoundary, StatusBadge } from "@/components/ui"

type SortKey = "date" | "payee" | "description" | "category" | "amount"
type SortDir = "asc" | "desc"

export default function DisbursementsPage() {
  const query = useDisbursements()
  const opsBalance = useBankBalance(() => "operational-hub")
  const [search, setSearch] = createSignal("")
  const [categoryFilter, setCategoryFilter] = createSignal<TxnCategory | "all">("all")
  const [sortKey, setSortKey] = createSignal<SortKey>("date")
  const [sortDir, setSortDir] = createSignal<SortDir>("desc")

  const totalExpenses = createMemo(() => {
    if (!query.data) return null
    return query.data.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
  })
  const categories = createMemo(() => {
    const values = new Set<TxnCategory>()
    for (const txn of query.data ?? []) {
      if (txn.category) values.add(txn.category)
    }
    return [...values].sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b)))
  })
  const filteredTxns = (txns: Transaction[]) => {
    const q = search().trim().toLowerCase()
    const selectedCategory = categoryFilter()

    return txns
      .filter(txn => {
        const matchesCategory = selectedCategory === "all" || txn.category === selectedCategory
        const text = [txn.payee, txn.description, txn.referenceId, txn.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return matchesCategory && (!q || text.includes(q))
      })
      .sort((a, b) => compareTxns(a, b, sortKey(), sortDir()))
  }
  const setSort = (key: SortKey) => {
    if (sortKey() === key) {
      setSortDir(sortDir() === "asc" ? "desc" : "asc")
      return
    }
    setSortKey(key)
    setSortDir(key === "amount" ? "desc" : "asc")
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
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
        <StatCard label="Total Disbursements" numeric value={query.data?.length ?? "-"} />
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
        {(txns: Transaction[]) => {
          const rows = createMemo(() => filteredTxns(txns))
          return (
            <div class="bg-surface rounded-lg border border-border overflow-hidden">
              <div class="px-5 py-4 border-b border-border space-y-3">
                <div class="flex items-center justify-between gap-3">
                  <h2 class="text-sm font-semibold text-foreground">Expense History</h2>
                  <p class="text-xs text-muted">
                    {rows().length === txns.length
                      ? `${txns.length} disbursements`
                      : `${rows().length} of ${txns.length}`}
                  </p>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3">
                  <input
                    type="search"
                    value={search()}
                    onInput={e => setSearch(e.currentTarget.value)}
                    placeholder="Search store, item, receipt, category"
                    class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <select
                    value={categoryFilter()}
                    onChange={e => setCategoryFilter(e.currentTarget.value as TxnCategory | "all")}
                    class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="all">All categories</option>
                    <For each={categories()}>
                      {category => <option value={category}>{categoryLabel(category)}</option>}
                    </For>
                  </select>
                </div>
              </div>
              <Show
                when={txns.length > 0}
                fallback={
                  <div class="py-12 text-center">
                    <Icons.receipt class="w-12 h-12 mx-auto mb-3 text-muted" />
                    <p class="text-sm font-medium text-foreground">No disbursements yet</p>
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
                  <DataTable>
                    <THead>
                      <Th>
                        <SortButton
                          label="Date"
                          active={sortKey() === "date"}
                          dir={sortDir()}
                          onClick={() => setSort("date")}
                        />
                      </Th>
                      <Th>
                        <SortButton
                          label="Store / Company"
                          active={sortKey() === "payee"}
                          dir={sortDir()}
                          onClick={() => setSort("payee")}
                        />
                      </Th>
                      <Th>
                        <SortButton
                          label="Description"
                          active={sortKey() === "description"}
                          dir={sortDir()}
                          onClick={() => setSort("description")}
                        />
                      </Th>
                      <Th>
                        <SortButton
                          label="Category"
                          active={sortKey() === "category"}
                          dir={sortDir()}
                          onClick={() => setSort("category")}
                        />
                      </Th>
                      <Th align="right">
                        <SortButton
                          label="Amount"
                          active={sortKey() === "amount"}
                          dir={sortDir()}
                          onClick={() => setSort("amount")}
                          align="right"
                        />
                      </Th>
                    </THead>
                    <tbody>
                      <For each={rows()}>
                        {(txn: Transaction) => (
                          <Tr>
                            <td class="py-4 px-6 text-sm text-muted">
                              {formatDatePH(txn.transactionDate ?? txn.createdAt)}
                            </td>
                            <td class="py-4 px-6 text-sm text-foreground">{txn.payee ?? "—"}</td>
                            <td class="py-4 px-6 text-sm text-foreground">{txn.description}</td>
                            <td class="py-4 px-6">
                              <StatusBadge status={categoryLabel(txn.category)} />
                            </td>
                            <td class="py-4 px-6 text-right text-sm font-semibold text-red-700 tabular-nums">
                              {formatPeso(Math.abs(Number(txn.amount)))}
                            </td>
                          </Tr>
                        )}
                      </For>
                    </tbody>
                  </DataTable>
                </Show>
              </Show>
            </div>
          )
        }}
      </QueryBoundary>
    </div>
  )
}

function categoryLabel(category?: string) {
  if (!category) return "Other"
  return GL_CATALOG[category as TxnCategory]?.label ?? category.replace(/_/g, " ")
}

function compareTxns(a: Transaction, b: Transaction, key: SortKey, dir: SortDir) {
  const multiplier = dir === "asc" ? 1 : -1
  const result =
    key === "amount"
      ? Math.abs(Number(a.amount)) - Math.abs(Number(b.amount))
      : textValue(a, key).localeCompare(textValue(b, key), undefined, { numeric: true })
  return result * multiplier
}

function textValue(txn: Transaction, key: Exclude<SortKey, "amount">) {
  if (key === "date") return txn.transactionDate ?? txn.createdAt
  if (key === "category") return categoryLabel(txn.category)
  return txn[key] ?? ""
}

function SortButton(props: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
  align?: "left" | "right"
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      class={`inline-flex w-full items-center gap-1 ${props.align === "right" ? "justify-end" : "justify-start"} hover:text-foreground`}
    >
      <span>{props.label}</span>
      <span class={`text-[10px] ${props.active ? "text-foreground" : "text-muted/60"}`}>
        {props.active ? (props.dir === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  )
}
