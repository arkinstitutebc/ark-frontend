import { DataTable, formatDatePH, formatPeso, PageHeader, Select, THead, Th, Tr } from "@ark/ui"
import { useBankBalance, useBanks, useTransactions, useTransfers } from "@data/hooks"
import type { Bank, Transaction, Transfer } from "@data/types"
import { createSignal, For, Show } from "solid-js"
import { TransferHistoryTable } from "@/components/finance/transfer-history-table"
import { Icons, QueryBoundary, StatusBadge } from "@/components/ui"

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

function getTxnDate(txn: Transaction) {
  return formatDatePH(txn.transactionDate ?? txn.createdAt)
}

export default function Page() {
  const [selectedBank, setSelectedBank] = createSignal<string>("all")

  const banksQuery = useBanks()
  const transfersQuery = useTransfers()
  const revenueBalance = useBankBalance(() => "revenue-vault")
  const opsBalance = useBankBalance(() => "operational-hub")
  const transactionsQuery = useTransactions(() => {
    const bank = selectedBank()
    return bank !== "all" ? { bankId: bank, limit: 50 } : { limit: 50 }
  })

  const getBalanceFor = (bankId: string): number | null => {
    if (bankId === "revenue-vault") return revenueBalance.data?.balance ?? null
    if (bankId === "operational-hub") return opsBalance.data?.balance ?? null
    return null
  }
  const getBankName = (bankId: string) =>
    (banksQuery.data || []).find((bank: Bank) => bank.id === bankId)?.name || bankId

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <PageHeader
        title="Banks & Transfers"
        subtitle="View balances, transfer history, and bank transactions"
        action={
          <a
            href="/transfers/create"
            class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            + New Transfer
          </a>
        }
      />

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
                          return balance !== null ? formatPeso(balance) : "-"
                        })()}
                      </p>
                    </div>
                    <p class="text-xs text-muted">{bank.accountNumber}</p>
                  </button>
                )}
              </For>
            </div>

            {/* Filter */}
            <div class="mb-4 max-w-xs">
              <Select
                value={selectedBank()}
                onChange={setSelectedBank}
                options={[
                  { label: "All Banks", value: "all" },
                  ...banks.map((bank: Bank) => ({ label: bank.bankName, value: bank.id })),
                ]}
                ariaLabel="Bank filter"
              />
            </div>
          </>
        )}
      </QueryBoundary>

      <QueryBoundary query={transfersQuery}>
        {(transfers: Transfer[]) => (
          <div class="bg-surface rounded-lg border border-border overflow-hidden mb-6">
            <div class="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 class="text-sm font-semibold text-foreground">Transfer History</h2>
              <p class="text-xs text-muted">{transfers.length} transfers</p>
            </div>
            <Show
              when={transfers.length > 0}
              fallback={
                <div class="py-10 text-center">
                  <Icons.arrowLeftRight class="w-10 h-10 mx-auto mb-3 text-muted" />
                  <p class="text-sm font-medium text-foreground">No transfers found</p>
                </div>
              }
            >
              <TransferHistoryTable transfers={transfers} getBankName={getBankName} />
            </Show>
          </div>
        )}
      </QueryBoundary>

      {/* Transactions */}
      <QueryBoundary query={transactionsQuery}>
        {data => (
          <div class="bg-surface rounded-lg border border-border overflow-hidden">
            <div class="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 class="text-sm font-semibold text-foreground">Recent Transactions</h2>
                <p class="text-xs text-muted mt-0.5">Latest bank activity by transaction date</p>
              </div>
              <p class="text-xs text-muted">
                Latest {data.items.length} of {data.total}
              </p>
            </div>
            <Show
              when={data.items.length > 0}
              fallback={
                <div class="py-10 text-center">
                  <Icons.receipt class="w-10 h-10 mx-auto mb-3 text-muted" />
                  <p class="text-sm font-medium text-foreground">No transactions found</p>
                </div>
              }
            >
              <DataTable>
                <THead>
                  <Th size="dense">Date</Th>
                  <Th size="dense">Type</Th>
                  <Th size="dense">Description</Th>
                  <Th size="dense" align="right">
                    Amount
                  </Th>
                </THead>
                <tbody>
                  <For each={data.items}>
                    {(txn: Transaction) => (
                      <Tr>
                        <td class="py-3 px-6 text-sm text-muted whitespace-nowrap">
                          {getTxnDate(txn)}
                        </td>
                        <td class="py-3 px-6">
                          <StatusBadge status={getTxnLabel(txn.type)} />
                        </td>
                        <td class="py-3 px-6 text-sm text-foreground max-w-[440px]">
                          <span class="block truncate" title={txn.description}>
                            {txn.description}
                          </span>
                          <Show when={txn.referenceId}>
                            <span class="block text-[11px] text-muted mt-0.5 truncate">
                              {txn.referenceId}
                            </span>
                          </Show>
                        </td>
                        <td
                          class={`py-3 px-6 text-right text-sm font-semibold tabular-nums ${getTxnColor(txn.type)}`}
                        >
                          {formatPeso(Math.abs(Number(txn.amount)))}
                        </td>
                      </Tr>
                    )}
                  </For>
                </tbody>
              </DataTable>
            </Show>
          </div>
        )}
      </QueryBoundary>
    </div>
  )
}
