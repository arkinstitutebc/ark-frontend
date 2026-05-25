import { PageHeader, Select, THead, Th, type ToneKind, tonePillClass } from "@ark/ui"
import { formatMovementQuantity, movementQuantityClass } from "@data/format"
import { useMovements } from "@data/hooks"
import type { StockMovement } from "@data/types"
import { createMemo, createSignal, For } from "solid-js"
import { Icons, QueryBoundary } from "@/components/ui"

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr))
}

const TYPE_TONE: Record<string, ToneKind> = {
  in: "positive",
  out: "negative",
  adjustment: "pending",
}

const TYPE_LABELS: Record<string, string> = { in: "IN", out: "OUT", adjustment: "ADJ" }

export default function MovementsPage() {
  const query = useMovements()
  const [searchQuery, setSearchQuery] = createSignal("")
  const [typeFilter, setTypeFilter] = createSignal<"all" | "in" | "out" | "adjustment">("all")

  const filteredMovements = createMemo(() => {
    const data = query.data || []
    return data.filter(m => {
      const matchesSearch =
        !searchQuery() || m.itemName?.toLowerCase().includes(searchQuery().toLowerCase())
      const matchesType = typeFilter() === "all" || m.type === typeFilter()
      return matchesSearch && matchesType
    })
  })

  const stats = createMemo(() => {
    const data = query.data || []
    return {
      total: data.length,
      totalIn: data.filter(m => m.type === "in").length,
      totalOut: data.filter(m => m.type === "out").length,
      totalAdj: data.filter(m => m.type === "adjustment").length,
    }
  })

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <PageHeader title="Stock Movements" subtitle="Audit log of all stock changes" />

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted">Total Movements</p>
          <p class="text-2xl text-foreground mt-1">{query.isSuccess ? stats().total : "-"}</p>
        </div>
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted">Stock In</p>
          <p class="text-2xl text-green-600 mt-1">{query.isSuccess ? stats().totalIn : "-"}</p>
        </div>
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted">Stock Out</p>
          <p class="text-2xl text-red-600 mt-1">{query.isSuccess ? stats().totalOut : "-"}</p>
        </div>
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted">Adjustments</p>
          <p class="text-2xl text-yellow-600 mt-1">{query.isSuccess ? stats().totalAdj : "-"}</p>
        </div>
      </div>

      <QueryBoundary query={query}>
        {(_movements: StockMovement[]) => (
          <div class="bg-surface rounded-lg border border-border overflow-hidden">
            <div class="px-6 py-4 border-b border-border">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-foreground">Movement History</h2>
                <div class="flex items-center gap-3">
                  <Select
                    value={typeFilter()}
                    onChange={setTypeFilter}
                    options={[
                      { label: "All Types", value: "all" },
                      { label: "Stock In", value: "in" },
                      { label: "Stock Out", value: "out" },
                      { label: "Adjustments", value: "adjustment" },
                    ]}
                    ariaLabel="Movement type filter"
                    class="w-44"
                  />
                  <div class="relative">
                    <Icons.search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      value={searchQuery()}
                      onInput={e => setSearchQuery(e.currentTarget.value)}
                      placeholder="Search items..."
                      class="pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
                    />
                  </div>
                </div>
              </div>
            </div>
            <table class="w-full">
              <THead>
                <Th size="dense">Date</Th>
                <Th size="dense">Item</Th>
                <Th size="dense">Type</Th>
                <Th size="dense">Quantity</Th>
                <Th size="dense">Reason / Reference</Th>
                <Th size="dense">User</Th>
              </THead>
              <tbody class="divide-y divide-border">
                <For each={filteredMovements()}>
                  {(m: StockMovement) => (
                    <tr class="hover:bg-surface-muted transition-colors">
                      <td class="px-6 py-4 text-sm text-foreground">{formatDate(m.createdAt)}</td>
                      <td class="px-6 py-4">
                        <p class="text-sm font-medium text-foreground">{m.itemName}</p>
                        <p class="text-xs text-muted mt-0.5">{m.batchCode}</p>
                      </td>
                      <td class="px-6 py-4">
                        <span
                          class={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${tonePillClass(TYPE_TONE[m.type] ?? "neutral")}`}
                        >
                          {TYPE_LABELS[m.type] || m.type}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <span class={`text-sm font-medium ${movementQuantityClass(m)}`}>
                          {formatMovementQuantity(m)}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <p class="text-sm text-foreground">{m.reason || m.reference || "-"}</p>
                        {m.reference && <p class="text-xs text-muted mt-0.5">Ref: {m.reference}</p>}
                      </td>
                      <td class="px-6 py-4 text-sm text-muted">{m.createdBy}</td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
            {filteredMovements().length === 0 && (
              <div class="px-6 py-12 text-center">
                <p class="text-sm text-muted">No movements found</p>
              </div>
            )}
          </div>
        )}
      </QueryBoundary>
    </div>
  )
}
