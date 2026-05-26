import { formatPeso, PageContainer, PageHeader } from "@ark/ui"
import { type PnlReport, usePnl } from "@data/hooks"
import { createSignal, For, Show } from "solid-js"
import { Icons, QueryBoundary } from "@/components/ui"

function downloadBlob(content: BlobPart, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

function toMonthValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function monthDate(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number)
  return new Date(year, month - 1, 1)
}

function formatMonth(monthValue: string) {
  return monthDate(monthValue).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  })
}

function shiftMonth(monthValue: string, delta: number) {
  const date = monthDate(monthValue)
  date.setMonth(date.getMonth() + delta)
  return toMonthValue(date)
}

export default function PnlPage() {
  const [selectedMonth, setSelectedMonth] = createSignal(toMonthValue(new Date()))
  const pnlQuery = usePnl(selectedMonth)

  const exportCsv = () => {
    const data = pnlQuery.data
    if (!data) return
    const batchIds = data.batches.map(b => b.id)
    const batchLabels = Object.fromEntries(data.batches.map(b => [b.id, b.batchCode]))

    const header = ["", ...batchIds.map(id => batchLabels[id as string]), "Total", "Ratio"].join(
      ","
    )
    const rows = data.rows.map(row => {
      const cells = [
        `"${row.label}"`,
        ...batchIds.map(id => String(row.values[id as string] || 0)),
        String(row.values.total || 0),
        row.values.ratio !== undefined ? `${row.values.ratio}%` : "",
      ]
      return cells.join(",")
    })
    downloadBlob([header, ...rows].join("\n"), `pnl-${selectedMonth()}.csv`, "text/csv")
  }

  const exportXlsx = async () => {
    const data = pnlQuery.data
    if (!data) return

    const { Workbook } = await import("exceljs")
    const wb = new Workbook()
    const ws = wb.addWorksheet(`P&L ${data.month}`)

    const batchIds = data.batches.map(b => b.id)
    const batchLabels = Object.fromEntries(data.batches.map(b => [b.id, b.batchCode]))

    ws.addRow(["Segmented Income Statement"])
    ws.addRow(["Ark Tech Institute Inc."])
    ws.addRow([`Period: ${data.month}`])
    ws.addRow([])

    const headerRow = ws.addRow([
      "",
      ...batchIds.map(id => batchLabels[id as string]),
      "Total",
      "Ratio",
    ])
    headerRow.font = { bold: true }
    headerRow.eachCell(cell => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } }
    })

    for (const row of data.rows) {
      const excelRow = ws.addRow([
        row.indent ? `  ${row.label}` : row.label,
        ...batchIds.map((id: string) => row.values[id] || 0),
        row.values.total || 0,
        row.values.ratio !== undefined ? `${row.values.ratio}%` : "",
      ])
      if (row.isHeader || row.isSubtotal) excelRow.font = { bold: true }
      for (let col = 2; col <= batchIds.length + 2; col++) {
        excelRow.getCell(col).numFmt = "#,##0"
      }
    }

    ws.getColumn(1).width = 35
    for (let i = 2; i <= batchIds.length + 3; i++) ws.getColumn(i).width = 18
    ws.views = [{ state: "frozen", ySplit: 5 }]

    const buffer = await wb.xlsx.writeBuffer()
    downloadBlob(
      buffer,
      `pnl-${data.month}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Profit & Loss Statement"
        subtitle="Batch-segmented monthly P&L"
        action={
          <a
            href={`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/finance/pnl/pdf?month=${selectedMonth()}`}
            target="_blank"
            rel="noopener"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted"
          >
            <Icons.fileText class="w-4 h-4" /> View PDF
          </a>
        }
      />

      <div class="flex flex-wrap gap-3 mb-6 items-end">
        <div class="block">
          <span class="block text-xs text-muted mb-1">Month</span>
          <div class="inline-flex items-center overflow-hidden rounded-lg border border-border bg-surface">
            <button
              type="button"
              onClick={() => setSelectedMonth(shiftMonth(selectedMonth(), -1))}
              class="h-10 w-10 inline-flex items-center justify-center text-muted hover:bg-surface-muted hover:text-foreground transition-colors"
              aria-label="Previous month"
            >
              <Icons.chevronLeft class="w-4 h-4" />
            </button>
            <div class="h-10 min-w-[172px] px-3 inline-flex items-center justify-center gap-2 border-x border-border text-sm font-medium text-foreground">
              <Icons.calendar class="w-4 h-4 text-muted" />
              <span>{formatMonth(selectedMonth())}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedMonth(shiftMonth(selectedMonth(), 1))}
              class="h-10 w-10 inline-flex items-center justify-center text-muted hover:bg-surface-muted hover:text-foreground transition-colors"
              aria-label="Next month"
            >
              <Icons.chevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            onClick={exportCsv}
            disabled={!pnlQuery.data}
            class="px-3 py-2 rounded-lg text-sm font-medium bg-surface text-foreground border border-border hover:bg-surface-muted disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <Icons.download class="w-3.5 h-3.5" /> CSV
          </button>
          <button
            type="button"
            onClick={exportXlsx}
            disabled={!pnlQuery.data}
            class="px-3 py-2 rounded-lg text-sm font-medium bg-surface text-foreground border border-border hover:bg-surface-muted disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <Icons.download class="w-3.5 h-3.5" /> XLSX
          </button>
        </div>
      </div>

      <QueryBoundary query={pnlQuery}>
        {(data: PnlReport) => (
          <div class="bg-surface rounded-lg border border-border overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-surface-muted border-b border-border">
                  <tr>
                    <th class="py-3 px-5 text-left text-xs font-semibold text-muted uppercase tracking-wider min-w-[250px]">
                      Line Item
                    </th>
                    <For each={data.batches}>
                      {b => (
                        <th class="py-3 px-5 text-right text-xs font-semibold text-muted uppercase tracking-wider min-w-[130px]">
                          {b.batchCode}
                        </th>
                      )}
                    </For>
                    <th class="py-3 px-5 text-right text-xs font-semibold text-muted uppercase tracking-wider min-w-[130px]">
                      Total
                    </th>
                    <th class="py-3 px-5 text-right text-xs font-semibold text-muted uppercase tracking-wider min-w-[80px]">
                      Ratio
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={data.rows}>
                    {row => (
                      <tr
                        class={`border-t transition-colors ${row.isSubtotal ? "border-border bg-surface-muted" : "border-border hover:bg-surface-muted/50"}`}
                      >
                        <td
                          class={`py-3 px-5 text-sm ${row.isHeader || row.isSubtotal ? "font-semibold text-foreground" : row.indent ? "pl-10 text-muted" : "text-foreground"}`}
                        >
                          {row.label}
                          <Show when={row.description}>
                            <span class="block text-[11px] text-muted font-normal mt-0.5">
                              {row.description}
                            </span>
                          </Show>
                        </td>
                        <For each={data.batches}>
                          {b => (
                            <td
                              class={`py-3 px-5 text-right text-sm tabular-nums ${row.isHeader || row.isSubtotal ? "font-semibold text-foreground" : row.indent ? "text-muted" : "text-foreground"}`}
                            >
                              {row.values[b.id] ? formatPeso(row.values[b.id]) : "-"}
                            </td>
                          )}
                        </For>
                        <td
                          class={`py-3 px-5 text-right text-sm tabular-nums font-semibold ${row.isSubtotal ? "text-foreground" : "text-foreground"}`}
                        >
                          {row.values.total ? formatPeso(row.values.total) : "-"}
                        </td>
                        <td class="py-3 px-5 text-right text-sm tabular-nums text-muted">
                          {row.values.ratio !== undefined ? `${row.values.ratio}%` : ""}
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </QueryBoundary>
    </PageContainer>
  )
}
