import { formatPeso, PageHeader, StatCard } from "@ark/ui"
import { useBankBalance, useBanks, useTransfers } from "@data/hooks"
import type { Bank, Transfer } from "@data/types"
import { Show } from "solid-js"
import { TransferHistoryTable } from "@/components/finance/transfer-history-table"
import { Icons, QueryBoundary } from "@/components/ui"

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
      <PageHeader
        title="Fund Transfers"
        subtitle="Internal transfers between Revenue Vault and Operational Hub"
        action={
          <a
            href="/transfers/create"
            class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            + New Transfer
          </a>
        }
      />

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Transfers" numeric value={transfersQuery.data?.length ?? "-"} />
        <StatCard
          label="Total Amount"
          numeric
          value={
            transfersQuery.data
              ? formatPeso(transfersQuery.data.reduce((s, t) => s + Number(t.amount), 0))
              : "-"
          }
        />
        <StatCard
          label="Revenue Vault Balance"
          numeric
          value={revenueBalance.data ? formatPeso(revenueBalance.data.balance) : "-"}
        />
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
                  <Icons.arrowLeftRight class="w-10 h-10 mx-auto mb-3 text-muted" />
                  <p class="text-sm font-medium text-foreground">No transfers found</p>
                  <p class="text-xs text-muted mt-1">
                    Create a transfer to move funds between banks
                  </p>
                </div>
              }
            >
              <TransferHistoryTable transfers={transfers} getBankName={getBankName} />
            </Show>
          </div>
        )}
      </QueryBoundary>
    </div>
  )
}
