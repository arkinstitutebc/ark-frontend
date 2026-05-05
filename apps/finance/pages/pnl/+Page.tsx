import { type PnlReport, usePnl } from "@data/hooks"
import { createSignal, For, Show } from "solid-js"
import { Icons, QueryBoundary } from "@/components/ui"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount)
}

function downloadBlob(content: BlobPart, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

export default function PnlPage() {
  const [selectedMonth, setSelectedMonth] = createSignal(new Date().toISOString().slice(0, 7))
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
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-foreground">Profit & Loss Statement</h1>
          <p class="text-sm text-muted mt-1">Segmented income statement by project</p>
        </div>
        <div class="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth()}
            onInput={e => setSelectedMonth(e.currentTarget.value)}
            class="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            type="button"
            onClick={exportCsv}
            disabled={!pnlQuery.data}
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted transition-colors disabled:opacity-50"
          >
            <Icons.download class="w-4 h-4" /> CSV
          </button>
          <button
            type="button"
            onClick={exportXlsx}
            disabled={!pnlQuery.data}
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
          >
            <Icons.download class="w-4 h-4" /> XLSX
          </button>
          <a
            href={`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/finance/pnl/pdf?month=${selectedMonth()}`}
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted transition-colors"
          >
            <Icons.download class="w-4 h-4" /> PDF
          </a>
        </div>
      </div>

      <QueryBoundary query={pnlQuery}>
        {(data: PnlReport) => (
          <div class="bg-surface rounded-lg border border-border overflow-hidden">
            <div class="px-5 py-4 border-b border-border">
              <p class="text-sm font-semibold text-foreground">Ark Tech Institute Inc.</p>
              <p class="text-xs text-muted mt-0.5">Period: {data.month}</p>
            </div>
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
                              {row.values[b.id] ? formatCurrency(row.values[b.id]) : "-"}
                            </td>
                          )}
                        </For>
                        <td
                          class={`py-3 px-5 text-right text-sm tabular-nums font-semibold ${row.isSubtotal ? "text-foreground" : "text-foreground"}`}
                        >
                          {row.values.total ? formatCurrency(row.values.total) : "-"}
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
    </div>
  )
}
