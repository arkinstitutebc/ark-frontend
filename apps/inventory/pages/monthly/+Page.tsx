import { formatDatePH, PageContainer, PageHeader } from "@ark/ui"
import { useGenerateMonthlyReport, useMonthlyReports } from "@data/hooks"
import { createSignal, For, Show } from "solid-js"
import { QueryBoundary, StatusBadge } from "@/components/ui"

export default function MonthlyReportsPage() {
  const query = useMonthlyReports()
  const generate = useGenerateMonthlyReport()
  const [month, setMonth] = createSignal(new Date().toISOString().slice(0, 7))
  return (
    <PageContainer>
      <PageHeader
        title="Monthly Toolkeeping"
        subtitle="Generate a manual checklist containing every current tool and equipment record"
      />
      <form
        class="mb-6 flex gap-3 rounded-lg border border-border bg-surface p-5"
        onSubmit={event => {
          event.preventDefault()
          generate.mutate({ month: month() })
        }}
      >
        <input
          type="month"
          required
          value={month()}
          onInput={event => setMonth(event.currentTarget.value)}
          class="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          Generate checklist
        </button>
      </form>
      <QueryBoundary query={query}>
        {rows => (
          <div class="overflow-hidden rounded-lg border border-border bg-surface">
            <For each={rows}>
              {report => (
                <a
                  href={`/monthly/${report.id}`}
                  class="flex items-center justify-between border-b border-border px-5 py-4 last:border-0 hover:bg-surface-muted"
                >
                  <div>
                    <p class="font-medium">
                      {new Date(report.month).toLocaleDateString("en-PH", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p class="text-xs text-muted">
                      Created {formatDatePH(report.createdAt ?? report.month)}
                    </p>
                  </div>
                  <StatusBadge status={report.status} />
                </a>
              )}
            </For>
            <Show when={rows.length === 0}>
              <p class="py-12 text-center text-sm text-muted">No monthly checklists yet.</p>
            </Show>
          </div>
        )}
      </QueryBoundary>
    </PageContainer>
  )
}
