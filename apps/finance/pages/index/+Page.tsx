import { useBankBalance, useTransactions } from "@data/hooks"
import type { Transaction } from "@data/types"
import { createMemo, For } from "solid-js"
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
  })
}

function getTxnColor(type: string) {
  switch (type) {
    case "income":
      return "text-green-700"
    case "expense":
      return "text-red-700"
    default:
      return "text-gray-700"
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
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-gray-900">Financial Overview</h1>
        <p class="text-sm text-gray-500 mt-1">Two-bank system tracking and P&L management</p>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500 mb-1">Revenue Vault</p>
          <p class="text-2xl text-gray-900 tabular-nums tracking-tight">
            {revenueBalance.data ? formatCurrency(revenueBalance.data.balance) : "-"}
          </p>
          <p class="text-xs text-gray-400 mt-1">Land Bank</p>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500 mb-1">Operational Hub</p>
          <p class="text-2xl text-gray-900 tabular-nums tracking-tight">
            {opsBalance.data ? formatCurrency(opsBalance.data.balance) : "-"}
          </p>
          <p class="text-xs text-gray-400 mt-1">Security Bank</p>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500 mb-1">Total Balance</p>
          <p class="text-2xl text-gray-900 tabular-nums tracking-tight">
            {(() => {
              const v = totalBalance()
              return v !== null ? formatCurrency(v) : "-"
            })()}
          </p>
          <p class="text-xs text-gray-400 mt-1">Combined banks</p>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500 mb-1">Transactions</p>
          <p class="text-2xl text-gray-900 tabular-nums tracking-tight">
            {transactionsQuery.data?.length ?? "-"}
          </p>
          <p class="text-xs text-gray-400 mt-1">Recent activity</p>
        </div>
      </div>

      {/* Bank Balances Detail */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h3 class="text-sm font-semibold text-gray-900 mb-4">Bank Balances</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between py-2">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-blue-50 rounded-lg">
                  <Icons.landmark class="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">Revenue Vault</p>
                  <p class="text-xs text-gray-500">Land Bank</p>
                </div>
              </div>
              <p class="text-sm font-semibold text-gray-900 tabular-nums">
                {revenueBalance.data ? formatCurrency(revenueBalance.data.balance) : "-"}
              </p>
            </div>
            <div class="flex items-center justify-between py-2">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-green-50 rounded-lg">
                  <Icons.wallet class="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">Operational Hub</p>
                  <p class="text-xs text-gray-500">Security Bank</p>
                </div>
              </div>
              <p class="text-sm font-semibold text-gray-900 tabular-nums">
                {opsBalance.data ? formatCurrency(opsBalance.data.balance) : "-"}
              </p>
            </div>
            <div class="pt-3 border-t border-gray-100 flex items-center justify-between">
              <p class="text-sm text-gray-600">Total</p>
              <p class="text-sm font-semibold text-gray-900 tabular-nums">
                {(() => {
                  const v = totalBalance()
                  return v !== null ? formatCurrency(v) : "-"
                })()}
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder for AR summary — will wire when billing API is cross-queryable */}
        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h3 class="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div class="space-y-3">
            <a
              href="/transfers/create"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Icons.arrowLeftRight class="w-5 h-5 text-gray-400" />
              <div>
                <p class="text-sm font-medium text-gray-900">New Transfer</p>
                <p class="text-xs text-gray-500">Move funds between banks</p>
              </div>
            </a>
            <a
              href="/disbursements/create"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Icons.receipt class="w-5 h-5 text-gray-400" />
              <div>
                <p class="text-sm font-medium text-gray-900">New Disbursement</p>
                <p class="text-xs text-gray-500">Record an expense</p>
              </div>
            </a>
            <a
              href="/pnl"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Icons.fileText class="w-5 h-5 text-gray-400" />
              <div>
                <p class="text-sm font-medium text-gray-900">P&L Report</p>
                <p class="text-xs text-gray-500">Segmented income statement</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <QueryBoundary query={transactionsQuery}>
        {(txns: Transaction[]) => (
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-200">
              <h2 class="text-sm font-semibold text-gray-900">Recent Transactions</h2>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Reference
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th class="py-4 px-6 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={txns}>
                    {txn => (
                      <tr class="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td class="py-4 px-6">
                          <span class="text-sm font-medium text-gray-900">
                            {txn.referenceId || txn.id.slice(0, 8)}
                          </span>
                        </td>
                        <td class="py-4 px-6">
                          <StatusBadge status={getTxnLabel(txn.type)} />
                        </td>
                        <td class="py-4 px-6 text-sm text-gray-600">{txn.description}</td>
                        <td
                          class={`py-4 px-6 text-right text-sm font-semibold tabular-nums ${getTxnColor(txn.type)}`}
                        >
                          {formatCurrency(Math.abs(Number(txn.amount)))}
                        </td>
                        <td class="py-4 px-6 text-sm text-gray-600">{formatDate(txn.createdAt)}</td>
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
