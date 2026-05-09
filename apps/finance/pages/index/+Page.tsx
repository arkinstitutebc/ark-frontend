import { formatPeso, PageHeader, StatCard, THead, Th } from "@ark/ui"
import { useBankBalance, useTransactions } from "@data/hooks"
import type { Transaction } from "@data/types"
import { createMemo, For } from "solid-js"
import { Icons, QueryBoundary, StatusBadge } from "@/components/ui"

// formatDate kept locally — uses a no-year compact format that's not in the shared lib
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  })
}

function getTxnColor(type: string) {
  switch (type) {
    case "income":
      return "text-green-700"
    case "expense":
      return "text-red-700"
    default:
      return "text-foreground"
  }
}

function getTxnLabel(type: string) {
  switch (type) {
    case "transfer_in":
    case "transfer_out":
      return "transfer"
    default:
      return type
  }
}

export default function Page() {
  const revenueBalance = useBankBalance(() => "revenue-vault")
  const opsBalance = useBankBalance(() => "operational-hub")
  const transactionsQuery = useTransactions(() => ({ limit: 5 }))

  const totalBalance = createMemo(() => {
    if (!revenueBalance.data || !opsBalance.data) return null
    return revenueBalance.data.balance + opsBalance.data.balance
  })

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <PageHeader
        title="Financial Overview"
        subtitle="Two-bank system tracking and P&L management"
      />

      {/* Stats Cards */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Revenue Vault"
          numeric
          value={revenueBalance.data ? formatPeso(revenueBalance.data.balance) : "-"}
          hint="Land Bank"
        />
        <StatCard
          label="Operational Hub"
          numeric
          value={opsBalance.data ? formatPeso(opsBalance.data.balance) : "-"}
          hint="Security Bank"
        />
        <StatCard
          label="Total Balance"
          numeric
          value={(() => {
            const v = totalBalance()
            return v !== null ? formatPeso(v) : "-"
          })()}
          hint="Combined banks"
        />
        <StatCard
          label="Transactions"
          numeric
          value={transactionsQuery.data?.length ?? "-"}
          hint="Recent activity"
        />
      </div>

      {/* Bank Balances Detail */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="bg-surface rounded-lg border border-border p-5">
          <h3 class="text-sm font-semibold text-foreground mb-4">Bank Balances</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between py-2">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-blue-50 rounded-lg">
                  <Icons.landmark class="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p class="text-sm font-medium text-foreground">Revenue Vault</p>
                  <p class="text-xs text-muted">Land Bank</p>
                </div>
              </div>
              <p class="text-sm font-semibold text-foreground tabular-nums">
                {revenueBalance.data ? formatPeso(revenueBalance.data.balance) : "-"}
              </p>
            </div>
            <div class="flex items-center justify-between py-2">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-green-50 rounded-lg">
                  <Icons.wallet class="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p class="text-sm font-medium text-foreground">Operational Hub</p>
                  <p class="text-xs text-muted">Security Bank</p>
                </div>
              </div>
              <p class="text-sm font-semibold text-foreground tabular-nums">
                {opsBalance.data ? formatPeso(opsBalance.data.balance) : "-"}
              </p>
            </div>
            <div class="pt-3 border-t border-border flex items-center justify-between">
              <p class="text-sm text-muted">Total</p>
              <p class="text-sm font-semibold text-foreground tabular-nums">
                {(() => {
                  const v = totalBalance()
                  return v !== null ? formatPeso(v) : "-"
                })()}
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder for AR summary — will wire when billing API is cross-queryable */}
        <div class="bg-surface rounded-lg border border-border p-5">
          <h3 class="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
          <div class="space-y-3">
            <a
              href="/transfers/create"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-muted transition-colors"
            >
              <Icons.arrowLeftRight class="w-5 h-5 text-muted" />
              <div>
                <p class="text-sm font-medium text-foreground">New Transfer</p>
                <p class="text-xs text-muted">Move funds between banks</p>
              </div>
            </a>
            <a
              href="/disbursements/create"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-muted transition-colors"
            >
              <Icons.receipt class="w-5 h-5 text-muted" />
              <div>
                <p class="text-sm font-medium text-foreground">New Disbursement</p>
                <p class="text-xs text-muted">Record an expense</p>
              </div>
            </a>
            <a
              href="/pnl"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-muted transition-colors"
            >
              <Icons.fileText class="w-5 h-5 text-muted" />
              <div>
                <p class="text-sm font-medium text-foreground">P&L Report</p>
                <p class="text-xs text-muted">Segmented income statement</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <QueryBoundary query={transactionsQuery}>
        {(txns: Transaction[]) => (
          <div class="bg-surface rounded-lg border border-border overflow-hidden">
            <div class="px-5 py-4 border-b border-border">
              <h2 class="text-sm font-semibold text-foreground">Recent Transactions</h2>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <THead>
                  <Th>Reference</Th>
                  <Th>Type</Th>
                  <Th>Description</Th>
                  <Th align="right">Amount</Th>
                  <Th>Date</Th>
                </THead>
                <tbody>
                  <For each={txns}>
                    {txn => (
                      <tr class="border-t border-border hover:bg-surface-muted transition-colors">
                        <td class="py-4 px-6">
                          <span class="text-sm font-medium text-foreground">
                            {txn.referenceId || txn.id.slice(0, 8)}
                          </span>
                        </td>
                        <td class="py-4 px-6">
                          <StatusBadge status={getTxnLabel(txn.type)} />
                        </td>
                        <td class="py-4 px-6 text-sm text-muted">{txn.description}</td>
                        <td
                          class={`py-4 px-6 text-right text-sm font-semibold tabular-nums ${getTxnColor(txn.type)}`}
                        >
                          {formatPeso(Math.abs(Number(txn.amount)))}
                        </td>
                        <td class="py-4 px-6 text-sm text-muted">{formatDate(txn.createdAt)}</td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </QueryBoundary>
    </div>
  )
}
