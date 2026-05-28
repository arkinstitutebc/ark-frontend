import { DataTable, formatPeso, PageContainer, PageHeader, THead, Th, Tr } from "@ark/ui"
import { type PnlReport, usePnl } from "@data/hooks"
import { createSignal, For, Show } from "solid-js"
import { currentMonthValue, MonthStepper } from "@/components/finance/report-controls"
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

export default function PnlPage() {
  const [selectedMonth, setSelectedMonth] = createSignal(currentMonthValue())
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

    const ExcelJS = await import("exceljs/dist/exceljs.min.js")
    const wb = new ExcelJS.Workbook()
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
        <MonthStepper value={selectedMonth()} onChange={setSelectedMonth} />
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
            <DataTable>
              <THead>
                <Th size="dense" class="min-w-[250px]">
                  Line Item
                </Th>
                <For each={data.batches}>
                  {b => (
                    <Th size="dense" align="right" class="min-w-[130px]">
                      {b.batchCode}
                    </Th>
                  )}
                </For>
                <Th size="dense" align="right" class="min-w-[130px]">
                  Total
                </Th>
                <Th size="dense" align="right" class="min-w-[80px]">
                  Ratio
                </Th>
              </THead>
              <tbody>
                <For each={data.rows}>
                  {row => (
                    <Tr
                      hover={!row.isHeader && !row.isSubtotal}
                      class={row.isSubtotal ? "bg-surface-muted" : ""}
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
                      <td class="py-3 px-5 text-right text-sm tabular-nums font-semibold text-foreground">
                        {row.values.total ? formatPeso(row.values.total) : "-"}
                      </td>
                      <td class="py-3 px-5 text-right text-sm tabular-nums text-muted">
                        {row.values.ratio !== undefined ? `${row.values.ratio}%` : ""}
                      </td>
                    </Tr>
                  )}
                </For>
              </tbody>
            </DataTable>
          </div>
        )}
      </QueryBoundary>
    </PageContainer>
  )
}
