import { useBankBalance, useBanks, useTransactions } from "@data/hooks"
import type { Bank, Transaction } from "@data/types"
import { createSignal, For } from "solid-js"
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

function getTxnLabel(type: string) {
  switch (type) {
    case "transfer_in":
      return "transfer in"
    case "transfer_out":
      return "transfer out"
    default:
      return type
  }
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

export default function Page() {
  const [selectedBank, setSelectedBank] = createSignal<string>("all")

  const banksQuery = useBanks()
  const revenueBalance = useBankBalance(() => "revenue-vault")
  const opsBalance = useBankBalance(() => "operational-hub")
  const transactionsQuery = useTransactions(() => {
    const bank = selectedBank()
    return bank !== "all" ? { bankId: bank } : {}
  })

  const getBalanceFor = (bankId: string): number | null => {
    if (bankId === "revenue-vault") return revenueBalance.data?.balance ?? null
    if (bankId === "operational-hub") return opsBalance.data?.balance ?? null
    return null
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-foreground">Bank Accounts</h1>
        <p class="text-sm text-muted mt-1">View balances and transaction history</p>
      </div>

      {/* Bank Cards */}
      <QueryBoundary query={banksQuery}>
        {(banks: Bank[]) => (
          <>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <For each={banks}>
                {(bank: Bank) => (
                  <button
                    type="button"
                    class={`text-left bg-surface rounded-lg border p-5 transition-colors ${
                      selectedBank() === bank.id || selectedBank() === "all"
                        ? "border-primary ring-1 ring-primary/20"
                        : "border-border hover:border-border"
                    }`}
                    onClick={() => setSelectedBank(bank.id)}
                  >
                    <div class="flex items-center justify-between mb-4">
                      <div class="flex items-center gap-3">
                        <div
                          class={`p-2 rounded-lg ${bank.id === "revenue-vault" ? "bg-blue-50" : "bg-green-50"}`}
                        >
                          <Icons.landmark
                            class={`w-5 h-5 ${bank.id === "revenue-vault" ? "text-blue-600" : "text-green-600"}`}
                          />
                        </div>
                        <div>
                          <p class="text-base font-semibold text-foreground">{bank.name}</p>
                          <p class="text-xs text-muted">{bank.bankName}</p>
                        </div>
                      </div>
                      <p class="text-xl font-semibold text-foreground tabular-nums">
                        {(() => {
                          const balance = getBalanceFor(bank.id)
                          return balance !== null ? formatCurrency(balance) : "-"
                        })()}
                      </p>
                    </div>
                    <p class="text-xs text-muted">{bank.accountNumber}</p>
                  </button>
                )}
              </For>
            </div>

            {/* Filter */}
            <div class="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setSelectedBank("all")}
                class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedBank() === "all"
                    ? "bg-primary text-white"
                    : "bg-surface text-foreground border border-border hover:bg-surface-muted"
                }`}
              >
                All Banks
              </button>
              <For each={banks}>
                {(bank: Bank) => (
                  <button
                    type="button"
                    onClick={() => setSelectedBank(bank.id)}
                    class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedBank() === bank.id
                        ? "bg-primary text-white"
                        : "bg-surface text-foreground border border-border hover:bg-surface-muted"
                    }`}
                  >
                    {bank.bankName}
                  </button>
                )}
              </For>
            </div>
          </>
        )}
      </QueryBoundary>

      {/* Transactions */}
      <QueryBoundary query={transactionsQuery}>
        {(txns: Transaction[]) => (
          <div class="bg-surface rounded-lg border border-border overflow-hidden">
            <div class="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 class="text-sm font-semibold text-foreground">Transaction History</h2>
              <p class="text-xs text-muted">{txns.length} transactions</p>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-surface-muted border-b border-border">
                  <tr>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      Reference
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      Type
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      Description
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
                          {formatCurrency(Math.abs(Number(txn.amount)))}
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
