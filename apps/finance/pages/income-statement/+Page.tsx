import { API_URL } from "@ark/api-client"
import type { IncomeStatementSegment } from "@ark/data-types"
import { formatPeso, Icons, PageContainer, PageHeader } from "@ark/ui"
import { useIncomeStatement } from "@data/hooks"
import { createMemo, createSignal, For, Show } from "solid-js"

const SEGMENT_LABEL: Record<IncomeStatementSegment, string> = {
  JDVP: "JDVP",
  "TWSP-FBS": "TWSP F&B",
  "TWSP-HSK": "TWSP HSK",
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function currentQuarter() {
  const now = new Date()
  const q = Math.floor(now.getMonth() / 3)
  return {
    from: new Date(now.getFullYear(), q * 3, 1).toISOString().slice(0, 10),
    to: new Date(now.getFullYear(), q * 3 + 3, 0).toISOString().slice(0, 10),
  }
}

function lastQuarter() {
  const now = new Date()
  const q = Math.floor(now.getMonth() / 3) - 1
  const year = q < 0 ? now.getFullYear() - 1 : now.getFullYear()
  const adjQ = (q + 4) % 4
  return {
    from: new Date(year, adjQ * 3, 1).toISOString().slice(0, 10),
    to: new Date(year, adjQ * 3 + 3, 0).toISOString().slice(0, 10),
  }
}

function yearToDate() {
  const now = new Date()
  return {
    from: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10),
    to: todayIso(),
  }
}

export default function IncomeStatementPage() {
  const initial = currentQuarter()
  const [from, setFrom] = createSignal(initial.from)
  const [to, setTo] = createSignal(initial.to)

  const range = createMemo(() => ({ from: from(), to: to() }))
  const query = useIncomeStatement(range)

  const setRange = (r: { from: string; to: string }) => {
    setFrom(r.from)
    setTo(r.to)
  }

  const pdfHref = () => `${API_URL}/api/finance/income-statement/pdf?from=${from()}&to=${to()}`

  return (
    <PageContainer>
      <PageHeader
        title="Segmented Income Statement"
        subtitle="Profit-center breakdown — JDVP / TWSP F&B / TWSP HSK + Common/Admin"
        action={
          <a
            href={pdfHref()}
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted"
          >
            <Icons.fileText class="w-4 h-4" /> View PDF
          </a>
        }
      />

      <div class="flex flex-wrap gap-3 mb-6 items-end">
        <label class="block">
          <span class="block text-xs text-muted mb-1">From</span>
          <input
            type="date"
            value={from()}
            onInput={e => setFrom(e.currentTarget.value)}
            class="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </label>
        <label class="block">
          <span class="block text-xs text-muted mb-1">To</span>
          <input
            type="date"
            value={to()}
            onInput={e => setTo(e.currentTarget.value)}
            class="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </label>
        <div class="flex gap-2">
          <button
            type="button"
            onClick={() => setRange(currentQuarter())}
            class="px-3 py-2 rounded-lg text-sm font-medium bg-surface text-foreground border border-border hover:bg-surface-muted"
          >
            Current quarter
          </button>
          <button
            type="button"
            onClick={() => setRange(lastQuarter())}
            class="px-3 py-2 rounded-lg text-sm font-medium bg-surface text-foreground border border-border hover:bg-surface-muted"
          >
            Last quarter
          </button>
          <button
            type="button"
            onClick={() => setRange(yearToDate())}
            class="px-3 py-2 rounded-lg text-sm font-medium bg-surface text-foreground border border-border hover:bg-surface-muted"
          >
            Year to date
          </button>
        </div>
      </div>

      <Show
        when={query.data}
        keyed
        fallback={
          <div class="py-16 text-center text-sm text-muted">
            <Show when={query.isPending}>Loading…</Show>
            <Show when={query.isError}>Could not load the income statement.</Show>
          </div>
        }
      >
        {data => (
          <div class="bg-surface rounded-lg border border-border overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-surface-muted border-b border-border">
                  <tr>
                    <th class="text-left px-6 py-3 text-xs font-semibold text-muted uppercase">
                      Line Item
                    </th>
                    <For each={data.segments}>
                      {seg => (
                        <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase">
                          {SEGMENT_LABEL[seg]}
                        </th>
                      )}
                    </For>
                    <th class="text-right px-6 py-3 text-xs font-semibold text-muted uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={data.rows}>
                    {row => {
                      const isHeader = row.kind === "header"
                      const isSubtotal = row.kind === "subtotal"
                      const isComputed = row.kind === "computed"
                      const indent = row.indent ?? 0
                      const labelClass = isComputed
                        ? "px-6 py-3 font-bold text-primary uppercase tracking-wide"
                        : isHeader
                          ? "px-6 py-2 font-semibold text-muted uppercase text-xs bg-surface-muted/50"
                          : isSubtotal
                            ? "px-6 py-2 font-semibold text-foreground"
                            : "px-6 py-1.5 text-foreground"
                      const valueClass = isComputed
                        ? "px-4 py-3 text-right font-bold text-primary"
                        : isSubtotal
                          ? "px-4 py-2 text-right font-semibold text-foreground"
                          : "px-4 py-1.5 text-right text-foreground"
                      const rowClass = isComputed
                        ? "border-t-2 border-primary/40 bg-primary/5"
                        : isSubtotal
                          ? "border-t border-border"
                          : ""
                      const totalClass = isComputed
                        ? "px-6 py-3 text-right font-bold text-primary"
                        : isSubtotal
                          ? "px-6 py-2 text-right font-semibold text-foreground"
                          : "px-6 py-1.5 text-right text-foreground"
                      const labelStyle =
                        indent > 0 ? `padding-left: ${24 + indent * 16}px` : undefined

                      return (
                        <tr class={rowClass}>
                          <td class={labelClass} style={labelStyle}>
                            {row.label}
                          </td>
                          <Show
                            when={!isHeader}
                            fallback={
                              <>
                                <For each={data.segments}>{() => <td />}</For>
                                <td />
                              </>
                            }
                          >
                            <For each={data.segments}>
                              {seg => (
                                <td class={valueClass}>
                                  {row.bySegment[seg] ? formatPeso(row.bySegment[seg]) : "—"}
                                </td>
                              )}
                            </For>
                            <td class={totalClass}>{row.total ? formatPeso(row.total) : "—"}</td>
                          </Show>
                        </tr>
                      )
                    }}
                  </For>
                </tbody>
              </table>
            </div>
            <div class="px-6 py-3 border-t border-border text-xs text-muted">
              Period: {data.periodFrom} → {data.periodTo} · Net Operating Income:{" "}
              <span class="text-foreground font-semibold">
                {formatPeso(data.netOperatingIncome)}
              </span>
            </div>
          </div>
        )}
      </Show>
    </PageContainer>
  )
}
