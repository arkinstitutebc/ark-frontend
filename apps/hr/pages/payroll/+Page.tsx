import { formatDatePH, formatPeso } from "@ark/ui"
import { usePayroll } from "@data/hooks"
import type { PayrollPeriod } from "@data/types"
import { For } from "solid-js"
import { Icons, PayrollStatusBadge, QueryBoundary } from "@/components/ui"

export default function Page() {
  const query = usePayroll()

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-semibold text-foreground">Payroll</h1>
          <p class="text-sm text-muted mt-1">Semi-monthly payroll periods (15th & 30th)</p>
        </div>
      </div>

      <QueryBoundary query={query}>
        {(periods: PayrollPeriod[]) => (
          <div class="space-y-4">
            <For each={periods}>
              {(period: PayrollPeriod) => (
                <a
                  href={`/payroll/${period.id}`}
                  class="block bg-surface rounded-lg border border-border p-5 hover:border-primary/30 transition-colors"
                >
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="flex items-center gap-3 mb-2">
                        <h3 class="text-base font-semibold text-foreground">{period.label}</h3>
                        <PayrollStatusBadge status={period.status} />
                      </div>
                      <div class="flex items-center gap-4 text-sm text-muted">
                        <span>
                          {formatDatePH(period.periodStart)} — {formatDatePH(period.periodEnd)}
                        </span>
                        <span>{period.trainerCount} trainers</span>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="text-sm text-muted">Net Pay</p>
                      <p class="text-lg font-bold text-foreground">
                        {formatPeso(Number(period.totalNet || 0))}
                      </p>
                      <p class="text-xs text-muted">
                        Gross: {formatPeso(Number(period.totalGross || 0))}
                      </p>
                    </div>
                  </div>
                </a>
              )}
            </For>

            {periods.length === 0 && (
              <div class="text-center py-12 bg-surface rounded-lg border border-border">
                <Icons.creditCard class="w-12 h-12 mx-auto mb-3 text-muted" />
                <p class="text-sm font-medium text-foreground">No payroll periods</p>
              </div>
            )}
          </div>
        )}
      </QueryBoundary>
    </div>
  )
}
