import { BackLink, formatDatePH, formatPeso } from "@ark/ui"
import { type PayrollPeriodDetail, usePayrollPeriod, useProcessPayroll } from "@data/hooks"
import { createMemo, For } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"
import { Icons, QueryBoundary, StatusBadge } from "@/components/ui"

export default function Page() {
  const pageContext = usePageContext()
  const periodId = createMemo(() => pageContext.routeParams.period as string)
  const query = usePayrollPeriod(periodId)
  const processMutation = useProcessPayroll()

  const handleProcess = () => {
    if (!periodId()) return
    processMutation.mutate(periodId())
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <div class="mb-6">
        <BackLink href="/payroll">Back to Payroll</BackLink>
      </div>

      <QueryBoundary query={query}>
        {(data: PayrollPeriodDetail) => (
          <>
            <div class="flex items-start justify-between mb-8">
              <div>
                <div class="flex items-center gap-3 mb-2">
                  <h1 class="text-2xl font-semibold text-foreground">{data.label}</h1>
                  <StatusBadge status={data.status} />
                </div>
                <p class="text-sm text-muted">
                  {formatDatePH(data.periodStart)} — {formatDatePH(data.periodEnd)}
                </p>
              </div>
              <div class="flex items-center gap-2">
                {data.status === "draft" && (
                  <button
                    type="button"
                    onClick={handleProcess}
                    disabled={processMutation.isPending}
                    class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {processMutation.isPending ? "Processing..." : "Process Payroll"}
                  </button>
                )}
                {data.status !== "draft" && (
                  <a
                    href={`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/hr/payroll/${periodId()}/pdf`}
                    target="_blank"
                    rel="noopener"
                    class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted transition-colors"
                  >
                    <Icons.download class="w-4 h-4" /> Download PDF
                  </a>
                )}
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div class="bg-surface rounded-lg border border-border p-4">
                <p class="text-sm text-muted mb-1">Total Gross</p>
                <p class="text-2xl text-foreground tabular-nums">
                  {formatPeso(Number(data.totalGross || 0))}
                </p>
              </div>
              <div class="bg-surface rounded-lg border border-border p-4">
                <p class="text-sm text-muted mb-1">Total Net</p>
                <p class="text-2xl text-foreground tabular-nums">
                  {formatPeso(Number(data.totalNet || 0))}
                </p>
              </div>
              <div class="bg-surface rounded-lg border border-border p-4">
                <p class="text-sm text-muted mb-1">Trainers</p>
                <p class="text-2xl text-foreground">{data.trainerCount || 0}</p>
              </div>
            </div>

            {processMutation.isError && (
              <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-sm text-red-700">{processMutation.error?.message}</p>
              </div>
            )}

            <div class="bg-surface rounded-lg border border-border overflow-hidden">
              <div class="px-5 py-4 border-b border-border">
                <h2 class="text-sm font-semibold text-foreground">Payroll Entries</h2>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-surface-muted border-b border-border">
                    <tr>
                      <th class="py-4 px-6 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                        Trainer
                      </th>
                      <th class="py-4 px-6 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                        Hours
                      </th>
                      <th class="py-4 px-6 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                        Rate/hr
                      </th>
                      <th class="py-4 px-6 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                        Gross
                      </th>
                      <th class="py-4 px-6 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                        Deductions
                      </th>
                      <th class="py-4 px-6 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                        Net Pay
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={data.entries || []}>
                      {entry => (
                        <tr class="border-t border-border hover:bg-surface-muted transition-colors">
                          <td class="py-4 px-6 text-sm text-foreground">
                            {entry.trainerName || "—"}
                          </td>
                          <td class="py-4 px-6 text-right text-sm text-muted tabular-nums">
                            {Number(entry.totalHours || 0).toFixed(1)}
                          </td>
                          <td class="py-4 px-6 text-right text-sm text-muted tabular-nums">
                            {formatPeso(Number(entry.hourlyRate || 0))}
                          </td>
                          <td class="py-4 px-6 text-right text-sm text-foreground tabular-nums">
                            {formatPeso(Number(entry.grossPay || 0))}
                          </td>
                          <td class="py-4 px-6 text-right text-sm text-red-600 tabular-nums">
                            {formatPeso(Number(entry.deductions || 0))}
                          </td>
                          <td class="py-4 px-6 text-right text-sm font-semibold text-foreground tabular-nums">
                            {formatPeso(Number(entry.netPay || 0))}
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                  <tfoot class="bg-surface-muted border-t border-border">
                    <tr>
                      <td class="py-4 px-6 text-sm font-semibold text-foreground" colSpan={3}>
                        Total
                      </td>
                      <td class="py-4 px-6 text-right text-sm font-semibold text-foreground tabular-nums">
                        {formatPeso(Number(data.totalGross || 0))}
                      </td>
                      <td class="py-4 px-6 text-right text-sm font-semibold text-red-600 tabular-nums">
                        {formatPeso(Number(data.totalGross || 0) - Number(data.totalNet || 0))}
                      </td>
                      <td class="py-4 px-6 text-right text-sm font-semibold text-foreground tabular-nums">
                        {formatPeso(Number(data.totalNet || 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </QueryBoundary>
    </div>
  )
}
