import { formatDatePH, formatPeso, StatCard, THead, Th } from "@ark/ui"
import { useReceivables } from "@data/hooks"
import type { AccountReceivable } from "@data/types"
import { createMemo, For } from "solid-js"
import { QueryBoundary, StatusBadge } from "@/components/ui"

export default function Page() {
  const query = useReceivables()

  const arStats = createMemo(() => {
    const data = query.data || []
    const totalAmount = data.reduce((sum, ar) => sum + Number(ar.amount), 0)
    const outstanding = data
      .filter(ar => ar.status !== "paid")
      .reduce((sum, ar) => sum + Number(ar.amount) - Number(ar.paidAmount || 0), 0)
    const batchesBilled = data.filter(ar => ar.status === "billed" || ar.status === "paid").length
    const paymentsReceived = data.reduce((sum, ar) => sum + Number(ar.paidAmount || 0), 0)
    return { totalAmount, outstanding, batchesBilled, paymentsReceived, total: data.length }
  })

  const recentAr = createMemo(() =>
    [...(query.data || [])]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  )

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-foreground">Billing Overview</h1>
        <p class="text-sm text-muted mt-1">Track TESDA billing and accounts receivable</p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total AR Amount"
          numeric
          value={query.data ? formatPeso(arStats().totalAmount) : "-"}
          hint={query.data ? `${arStats().total} receivables` : ""}
        />
        <StatCard
          label="Outstanding"
          numeric
          value={query.data ? formatPeso(arStats().outstanding) : "-"}
          hint="Unpaid balance"
        />
        <StatCard
          label="Batches Billed"
          numeric
          value={query.data ? arStats().batchesBilled : "-"}
          hint={query.data ? `of ${arStats().total} total` : ""}
        />
        <StatCard
          label="Payments Received"
          numeric
          value={query.data ? formatPeso(arStats().paymentsReceived) : "-"}
          hint="Collected to date"
        />
      </div>

      <QueryBoundary query={query}>
        {(data: AccountReceivable[]) => (
          <>
            <div class="bg-surface rounded-lg border border-border p-5 mb-8">
              <h3 class="text-sm font-semibold text-foreground mb-4">AR by Status</h3>
              <div class="space-y-3">
                <For each={["created", "billed", "paid"] as const}>
                  {status => {
                    const items = () => data.filter(ar => ar.status === status)
                    return (
                      <div class="flex items-center justify-between py-2">
                        <div class="flex items-center gap-3">
                          <StatusBadge status={status} />
                          <span class="text-sm text-muted">
                            {items().length} receivable{items().length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <p class="text-sm font-semibold text-foreground tabular-nums">
                          {formatPeso(items().reduce((sum, ar) => sum + Number(ar.amount), 0))}
                        </p>
                      </div>
                    )
                  }}
                </For>
              </div>
            </div>

            <div class="bg-surface rounded-lg border border-border overflow-hidden">
              <div class="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 class="text-sm font-semibold text-foreground">Recent Receivables</h2>
                <a
                  href="/receivables"
                  class="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  View all
                </a>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <THead>
                    <Th>Batch Code</Th>
                    <Th align="right">Amount</Th>
                    <Th align="center">Status</Th>
                    <Th>Created</Th>
                  </THead>
                  <tbody>
                    <For each={recentAr()}>
                      {ar => (
                        <tr class="border-t border-border hover:bg-surface-muted transition-colors">
                          <td class="py-4 px-6 text-sm text-foreground">{ar.batchCode}</td>
                          <td class="py-4 px-6 text-right text-sm font-semibold text-foreground tabular-nums">
                            {formatPeso(Number(ar.amount))}
                          </td>
                          <td class="py-4 px-6 text-center">
                            <StatusBadge status={ar.status} />
                          </td>
                          <td class="py-4 px-6 text-sm text-muted">{formatDatePH(ar.createdAt)}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </QueryBoundary>
    </div>
  )
}
