import { useBankBalance, useBanks, useTransfers } from "@data/hooks"
import type { Bank, Transfer } from "@data/types"
import { For, Show } from "solid-js"
import { Icons, QueryBoundary } from "@/components/ui"

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
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function TransfersPage() {
  const transfersQuery = useTransfers()
  const banksQuery = useBanks()
  const revenueBalance = useBankBalance(() => "revenue-vault")

  const getBankName = (id: string) => {
    const bank = (banksQuery.data || []).find((b: Bank) => b.id === id)
    return bank?.name || id
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-semibold text-foreground">Fund Transfers</h1>
          <p class="text-sm text-muted mt-1">
            Internal transfers between Revenue Vault and Operational Hub
          </p>
        </div>
        <a
          href="/transfers/create"
          class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          + New Transfer
        </a>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted mb-1">Total Transfers</p>
          <p class="text-2xl text-foreground tabular-nums">{transfersQuery.data?.length ?? "-"}</p>
        </div>
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted mb-1">Total Amount</p>
          <p class="text-2xl text-foreground tabular-nums">
            {transfersQuery.data
              ? formatCurrency(transfersQuery.data.reduce((s, t) => s + Number(t.amount), 0))
              : "-"}
          </p>
        </div>
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted mb-1">Revenue Vault Balance</p>
          <p class="text-2xl text-foreground tabular-nums">
            {revenueBalance.data ? formatCurrency(revenueBalance.data.balance) : "-"}
          </p>
        </div>
      </div>

      <QueryBoundary query={transfersQuery}>
        {(transfers: Transfer[]) => (
          <div class="bg-surface rounded-lg border border-border overflow-hidden">
            <div class="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 class="text-sm font-semibold text-foreground">Transfer History</h2>
              <p class="text-xs text-muted">{transfers.length} transfers</p>
            </div>
            <Show
              when={transfers.length > 0}
              fallback={
                <div class="py-12 text-center">
                  <Icons.arrowLeftRight class="w-12 h-12 mx-auto mb-3 text-muted" />
                  <p class="text-sm font-medium text-foreground">No transfers found</p>
                  <p class="text-sm text-muted mt-1">
                    Create a transfer to move funds between banks
                  </p>
                </div>
              }
            >
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-surface-muted border-b border-border">
                    <tr>
                      <th class="py-4 px-6 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                        Transfer Flow
                      </th>
                      <th class="py-4 px-6 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                        Amount
                      </th>
                      <th class="py-4 px-6 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                        Reference
                      </th>
                      <th class="py-4 px-6 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={transfers}>
                      {(t: Transfer) => (
                        <tr class="border-t border-border hover:bg-surface-muted transition-colors">
                          <td class="py-4 px-6">
                            <div class="flex items-center gap-2 text-sm">
                              <span class="text-muted">{getBankName(t.fromBankId)}</span>
                              <Icons.arrowRight class="w-4 h-4 text-muted" />
                              <span class="text-muted">{getBankName(t.toBankId)}</span>
                            </div>
                          </td>
                          <td class="py-4 px-6 text-right text-sm font-semibold text-foreground tabular-nums">
                            {formatCurrency(Number(t.amount))}
                          </td>
                          <td class="py-4 px-6 text-sm text-muted">{t.reference || "-"}</td>
                          <td class="py-4 px-6 text-sm text-muted">{formatDate(t.createdAt)}</td>
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
