import { BackLink, PageContainer, PageHeader, QueryBoundary, statusTone, THead, Th } from "@ark/ui"
import { useCycleCount, useStock } from "@data/hooks"
import type { StockItem } from "@data/types"
import { createMemo, createSignal, For, Show } from "solid-js"
import { navigate } from "vike/client/router"

interface CountRow {
  itemId: string
  counted: number | ""
}

export default function StockTakePage() {
  const stockQuery = useStock()
  const cycleCount = useCycleCount()

  const [counts, setCounts] = createSignal<Record<string, number | "">>({})
  const [note, setNote] = createSignal("")

  const items = createMemo(() => (stockQuery.data ?? []) as StockItem[])

  const setCount = (id: string, value: string) => {
    if (value === "") {
      setCounts(prev => ({ ...prev, [id]: "" }))
      return
    }
    const n = Number.parseInt(value, 10)
    setCounts(prev => ({ ...prev, [id]: Number.isNaN(n) ? "" : Math.max(0, n) }))
  }

  const variance = (item: StockItem): number | null => {
    const counted = counts()[item.id]
    if (counted === undefined || counted === "") return null
    return counted - item.quantityOnHand
  }

  // Rows with a typed counted value, regardless of whether it differs.
  const filledRows = (): CountRow[] =>
    items()
      .map(item => ({ itemId: item.id, counted: counts()[item.id] ?? "" }))
      .filter(row => row.counted !== "")

  const adjustingCount = () =>
    filledRows().filter(row => {
      const item = items().find(i => i.id === row.itemId)
      return item && row.counted !== item.quantityOnHand
    }).length

  const submit = (e: Event) => {
    e.preventDefault()
    const rows = filledRows()
    if (rows.length === 0) return

    cycleCount.mutate(
      {
        note: note().trim() || undefined,
        items: rows.map(r => ({ itemId: r.itemId, countedQty: r.counted as number })),
      },
      {
        onSuccess: () => {
          navigate("/movements")
        },
      }
    )
  }

  return (
    <PageContainer>
      <div class="mb-4">
        <BackLink href="/">Back to Stock</BackLink>
      </div>

      <PageHeader
        title="Stock Take"
        subtitle="Walk the shelves, type the counted quantity for each item, then submit. Anything left blank is skipped. Differences are written as adjustment movements."
      />

      <QueryBoundary query={stockQuery}>
        {() => (
          <form onSubmit={submit}>
            <div class="bg-surface rounded-lg border border-border mb-4">
              <div class="px-6 py-4 border-b border-border">
                <label for="count-note" class="block text-sm font-medium text-foreground mb-1">
                  Session note (optional)
                </label>
                <input
                  id="count-note"
                  type="text"
                  value={note()}
                  onInput={e => setNote(e.currentTarget.value)}
                  placeholder="e.g. Q2 quarterly count, supply room"
                  class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p class="text-xs text-muted mt-1">
                  Appears on every adjustment row written from this session.
                </p>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <THead>
                    <Th size="dense">Item</Th>
                    <Th size="dense">Status</Th>
                    <Th size="dense" align="right">
                      On hand
                    </Th>
                    <Th size="dense" align="right">
                      Counted
                    </Th>
                    <Th size="dense" align="right">
                      Variance
                    </Th>
                  </THead>
                  <tbody>
                    <Show
                      when={items().length > 0}
                      fallback={
                        <tr>
                          <td colSpan={5} class="px-6 py-8 text-center text-sm text-muted">
                            No stock items to count.
                          </td>
                        </tr>
                      }
                    >
                      <For each={items()}>
                        {item => {
                          const tone = () => statusTone(item.status)
                          const v = () => variance(item)
                          return (
                            <tr class="border-t border-border">
                              <td class="px-6 py-3 text-sm">
                                <div class="font-medium text-foreground">{item.name}</div>
                                <div class="text-xs text-muted">
                                  {item.batchCode} · {item.unit}
                                </div>
                              </td>
                              <td class="px-6 py-3">
                                <span
                                  class={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${tone().bg} ${tone().text}`}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td class="px-6 py-3 text-sm text-right text-foreground tabular-nums">
                                {item.quantityOnHand}
                              </td>
                              <td class="px-6 py-3 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  inputMode="numeric"
                                  value={counts()[item.id] ?? ""}
                                  onInput={e => setCount(item.id, e.currentTarget.value)}
                                  placeholder="—"
                                  class="w-24 px-2 py-1.5 text-right border border-border rounded-md text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                              </td>
                              <td class="px-6 py-3 text-sm text-right tabular-nums">
                                <Show
                                  when={v() !== null}
                                  fallback={<span class="text-muted">—</span>}
                                >
                                  <span
                                    class={
                                      v() === 0
                                        ? "text-muted"
                                        : (v() ?? 0) > 0
                                          ? "text-green-700 font-medium"
                                          : "text-red-700 font-medium"
                                    }
                                  >
                                    {(v() ?? 0) > 0 ? "+" : ""}
                                    {v()}
                                  </span>
                                </Show>
                              </td>
                            </tr>
                          )
                        }}
                      </For>
                    </Show>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="flex items-center justify-between bg-surface rounded-lg border border-border px-6 py-4">
              <div class="text-sm text-muted">
                <span class="font-medium text-foreground">{filledRows().length}</span> counted ·{" "}
                <span class="font-medium text-foreground">{adjustingCount()}</span> will adjust
              </div>
              <div class="flex items-center gap-3">
                <a
                  href="/"
                  class="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-surface-muted transition-colors"
                >
                  Cancel
                </a>
                <button
                  type="submit"
                  disabled={cycleCount.isPending || filledRows().length === 0}
                  class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cycleCount.isPending ? "Saving..." : "Submit count"}
                </button>
              </div>
            </div>
          </form>
        )}
      </QueryBoundary>
    </PageContainer>
  )
}
