import { useBankBalance, useDisbursements } from "@data/hooks"
import type { Transaction } from "@data/types"
import { createMemo, For, Show } from "solid-js"
import { Icons, QueryBoundary, StatusBadge } from "@/components/ui"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function DisbursementsPage() {
  const query = useDisbursements()
  const opsBalance = useBankBalance(() => "operational-hub")

  const totalExpenses = createMemo(() => {
    if (!query.data) return null
    return query.data.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
  })

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-semibold text-foreground">Disbursements</h1>
          <p class="text-sm text-muted mt-1">Cash disbursements and operational expenses</p>
        </div>
        <a
          href="/disbursements/create"
          class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          + New Disbursement
        </a>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted mb-1">Total Disbursements</p>
          <p class="text-2xl text-foreground tabular-nums">{query.data?.length ?? "-"}</p>
        </div>
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted mb-1">Total Expenses</p>
          <p class="text-2xl text-foreground tabular-nums">
            {(() => {
              const v = totalExpenses()
              return v !== null ? formatCurrency(v) : "-"
            })()}
          </p>
        </div>
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted mb-1">Operational Hub Balance</p>
          <p class="text-2xl text-foreground tabular-nums">
            {opsBalance.data ? formatCurrency(opsBalance.data.balance) : "-"}
          </p>
        </div>
      </div>

      <QueryBoundary query={query}>
        {(txns: Transaction[]) => (
          <div class="bg-surface rounded-lg border border-border overflow-hidden">
            <div class="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 class="text-sm font-semibold text-foreground">Expense History</h2>
              <p class="text-xs text-muted">{txns.length} disbursements</p>
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
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-surface-muted border-b border-border">
                    <tr>
                      <th class="py-4 px-6 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                        Description
                      </th>
                      <th class="py-4 px-6 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                        Category
                      </th>
                      <th class="py-4 px-6 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                        Amount
                      </th>
                      <th class="py-4 px-6 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={txns}>
                      {(txn: Transaction) => (
                        <tr class="border-t border-border hover:bg-surface-muted transition-colors">
                          <td class="py-4 px-6 text-sm text-foreground">{txn.description}</td>
                          <td class="py-4 px-6">
                            <StatusBadge status={txn.category || "other"} />
                          </td>
                          <td class="py-4 px-6 text-right text-sm font-semibold text-red-700 tabular-nums">
                            {formatCurrency(Math.abs(Number(txn.amount)))}
                          </td>
                          <td class="py-4 px-6 text-sm text-muted">{formatDate(txn.createdAt)}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </Show>
          </div>
        )}
      </QueryBoundary>
    </div>
  )
}
