import { formatPeso, PageHeader, StatCard, THead, Th } from "@ark/ui"
import { useBankBalance, useTransactions } from "@data/hooks"
import type { Transaction } from "@data/types"
import { createMemo, createSignal, For, Show } from "solid-js"
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
  const transactionsQuery = useTransactions(() => ({ limit: 120 }))
  const [chartMode, setChartMode] = createSignal<"daily" | "category">("daily")

  const totalBalance = createMemo(() => {
    if (!revenueBalance.data || !opsBalance.data) return null
    return revenueBalance.data.balance + opsBalance.data.balance
  })
  const recentTxns = createMemo(() => transactionsQuery.data?.slice(0, 5) ?? [])
  const dailyExpenses = createMemo(() => buildDailyExpenseTrend(transactionsQuery.data ?? []))
  const categoryExpenses = createMemo(() => buildCategoryBreakdown(transactionsQuery.data ?? []))
  const recentExpenseTotal = createMemo(() =>
    dailyExpenses().reduce((sum, day) => sum + day.amount, 0)
  )

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
          hint="Recent window"
        />
      </div>

      <div class="bg-surface rounded-lg border border-border p-5 mb-8">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 class="text-sm font-semibold text-foreground">Spending Snapshot</h3>
            <p class="text-xs text-muted mt-1">Recent disbursement records</p>
          </div>
          <div class="flex items-center gap-3">
            <div class="inline-flex rounded-lg border border-border p-1">
              <button
                type="button"
                onClick={() => setChartMode("daily")}
                class={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${chartMode() === "daily" ? "bg-surface-muted text-foreground" : "text-muted hover:text-foreground"}`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setChartMode("category")}
                class={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${chartMode() === "category" ? "bg-surface-muted text-foreground" : "text-muted hover:text-foreground"}`}
              >
                Category
              </button>
            </div>
            <p class="text-sm font-semibold text-foreground tabular-nums">
              {formatPeso(recentExpenseTotal())}
            </p>
          </div>
        </div>
        <Show
          when={chartMode() === "daily"}
          fallback={<CategoryBreakdownChart points={categoryExpenses()} />}
        >
          <SpendingTrendChart points={dailyExpenses()} />
        </Show>
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
        {() => (
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
                  <For each={recentTxns()}>
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

interface DailyExpensePoint {
  date: string
  amount: number
}

interface CategoryExpensePoint {
  category: string
  amount: number
}

function buildDailyExpenseTrend(txns: Transaction[]): DailyExpensePoint[] {
  const byDate = new Map<string, number>()
  for (const txn of txns) {
    if (txn.type !== "expense") continue
    const date = (txn.transactionDate ?? txn.createdAt).slice(0, 10)
    byDate.set(date, (byDate.get(date) ?? 0) + Math.abs(Number(txn.amount)))
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, amount]) => ({ date, amount }))
}

function buildCategoryBreakdown(txns: Transaction[]): CategoryExpensePoint[] {
  const byCategory = new Map<string, number>()
  for (const txn of txns) {
    if (txn.type !== "expense") continue
    const key = txn.category ? txn.category.replace(/_/g, " ") : "Other"
    byCategory.set(key, (byCategory.get(key) ?? 0) + Math.abs(Number(txn.amount)))
  }

  return [...byCategory.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)
}

function SpendingTrendChart(props: { points: DailyExpensePoint[] }) {
  const width = () => Math.max(760, props.points.length * 92)
  const height = 180
  const padding = { top: 12, right: 20, bottom: 36, left: 68 }
  const points = () => props.points
  const max = () => Math.max(...points().map(point => point.amount), 1)
  const gridLines = () => [0.25, 0.5, 0.75, 1].map(ratio => ({ ratio, value: max() * ratio }))
  const coordinates = () => {
    const data = points()
    if (data.length === 1) {
      return [
        {
          x: width() / 2,
          y:
            height -
            padding.bottom -
            (data[0].amount / max()) * (height - padding.top - padding.bottom),
        },
      ]
    }
    return data.map((point, index) => ({
      x:
        padding.left +
        (index / Math.max(data.length - 1, 1)) * (width() - padding.left - padding.right),
      y: height - padding.bottom - (point.amount / max()) * (height - padding.top - padding.bottom),
    }))
  }
  const linePath = () =>
    coordinates()
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
      .join(" ")

  return (
    <Show
      when={points().length > 0}
      fallback={
        <div class="h-44 flex items-center justify-center text-sm text-muted">No spending yet.</div>
      }
    >
      <div class="h-52">
        <div class="overflow-x-auto">
          <svg
            viewBox={`0 0 ${width()} ${height}`}
            class="h-44 min-w-full"
            style={{ width: `${width()}px` }}
            role="img"
            aria-label="Daily spending trend"
          >
            <For each={gridLines()}>
              {line => {
                const y =
                  height - padding.bottom - line.ratio * (height - padding.top - padding.bottom)
                return (
                  <>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={width() - padding.right}
                      y2={y}
                      stroke="var(--color-border)"
                      stroke-dasharray="4 4"
                    />
                    <text x="8" y={y + 4} class="fill-muted text-[10px]">
                      {formatPeso(line.value)}
                    </text>
                  </>
                )
              }}
            </For>
            <line
              x1={padding.left}
              y1={height - padding.bottom}
              x2={width() - padding.right}
              y2={height - padding.bottom}
              stroke="var(--color-border)"
            />
            <path
              d={linePath()}
              fill="none"
              stroke="var(--color-primary)"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <For each={coordinates()}>
              {(point, index) => (
                <>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill="var(--color-surface)"
                    stroke="var(--color-primary)"
                    stroke-width="2"
                  >
                    <title>
                      {formatDate(points()[index()].date)} - {formatPeso(points()[index()].amount)}
                    </title>
                  </circle>
                  <text
                    x={point.x}
                    y={height - 12}
                    text-anchor="middle"
                    class="fill-muted text-[10px]"
                  >
                    {formatDate(points()[index()].date)}
                  </text>
                </>
              )}
            </For>
          </svg>
        </div>
      </div>
    </Show>
  )
}

function CategoryBreakdownChart(props: { points: CategoryExpensePoint[] }) {
  const total = () => props.points.reduce((sum, point) => sum + point.amount, 0)
  const max = () => Math.max(...props.points.map(point => point.amount), 1)

  return (
    <Show
      when={props.points.length > 0}
      fallback={
        <div class="h-44 flex items-center justify-center text-sm text-muted">
          No categories yet.
        </div>
      }
    >
      <div class="space-y-3">
        <For each={props.points}>
          {point => (
            <div class="grid grid-cols-[minmax(90px,140px)_1fr_auto] items-center gap-3">
              <p class="text-xs text-muted capitalize truncate" title={point.category}>
                {point.category}
              </p>
              <div class="h-2.5 rounded-full bg-surface-muted overflow-hidden">
                <div
                  class="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max(4, (point.amount / max()) * 100)}%` }}
                />
              </div>
              <div class="text-right">
                <p class="text-xs font-semibold text-foreground tabular-nums">
                  {formatPeso(point.amount)}
                </p>
                <p class="text-[10px] text-muted tabular-nums">
                  {total() > 0 ? `${Math.round((point.amount / total()) * 100)}%` : "0%"}
                </p>
              </div>
            </div>
          )}
        </For>
      </div>
    </Show>
  )
}
