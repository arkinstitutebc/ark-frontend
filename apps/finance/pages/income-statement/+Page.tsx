import { API_URL } from "@ark/api-client"
import type { IncomeStatementSegment } from "@ark/data-types"
import { DataTable, formatPeso, Icons, PageContainer, PageHeader, THead, Th, Tr } from "@ark/ui"
import { useIncomeStatement } from "@data/hooks"
import { createMemo, createSignal, For, Show } from "solid-js"
import { DateRangeControls, type DateRangePreset } from "@/components/finance/report-controls"

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
  const [preset, setPreset] = createSignal<DateRangePreset>("current-quarter")

  const range = createMemo(() => ({ from: from(), to: to() }))
  const query = useIncomeStatement(range)

  const setRange = (r: { from: string; to: string }, nextPreset: DateRangePreset) => {
    setFrom(r.from)
    setTo(r.to)
    setPreset(nextPreset)
  }

  const applyPreset = (value: Exclude<DateRangePreset, "custom">) => {
    if (value === "current-quarter") setRange(currentQuarter(), value)
    if (value === "last-quarter") setRange(lastQuarter(), value)
    if (value === "year-to-date") setRange(yearToDate(), value)
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

      <div class="mb-6">
        <DateRangeControls
          from={from()}
          to={to()}
          preset={preset()}
          onFromChange={value => {
            setFrom(value)
            setPreset("custom")
          }}
          onToChange={value => {
            setTo(value)
            setPreset("custom")
          }}
          onPresetChange={applyPreset}
        />
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
            <DataTable>
              <THead>
                <Th size="dense">Line Item</Th>
                <For each={data.segments}>
                  {seg => (
                    <Th size="dense" align="right">
                      {SEGMENT_LABEL[seg]}
                    </Th>
                  )}
                </For>
                <Th size="dense" align="right">
                  Total
                </Th>
              </THead>
              <tbody>
                <For each={data.rows}>
                  {row => {
                    const isHeader = row.kind === "header"
                    const isSubtotal = row.kind === "subtotal"
                    const isComputed = row.kind === "computed"
                    const indent = row.indent ?? 0
                    const labelClass = isComputed
                      ? "px-6 py-3 font-semibold text-foreground uppercase tracking-wide text-xs"
                      : isHeader
                        ? "px-6 py-2 font-semibold text-muted uppercase text-xs bg-surface-muted/50"
                        : isSubtotal
                          ? "px-6 py-2 font-semibold text-foreground"
                          : "px-6 py-1.5 text-foreground"
                    const valueClass = isComputed
                      ? "px-6 py-3 text-right font-semibold text-foreground tabular-nums"
                      : isSubtotal
                        ? "px-6 py-2 text-right font-semibold text-foreground tabular-nums"
                        : "px-6 py-1.5 text-right text-foreground tabular-nums"
                    const rowClass = isComputed ? "bg-surface-muted" : isSubtotal ? "" : ""
                    const totalClass = isComputed
                      ? "px-6 py-3 text-right font-semibold text-foreground tabular-nums"
                      : isSubtotal
                        ? "px-6 py-2 text-right font-semibold text-foreground tabular-nums"
                        : "px-6 py-1.5 text-right text-foreground tabular-nums"
                    const labelStyle =
                      indent > 0 ? `padding-left: ${24 + indent * 16}px` : undefined

                    return (
                      <Tr class={rowClass} hover={!isHeader && !isComputed}>
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
                      </Tr>
                    )
                  }}
                </For>
              </tbody>
            </DataTable>
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
