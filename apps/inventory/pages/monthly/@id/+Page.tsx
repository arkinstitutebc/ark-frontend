import { BackLink, PageContainer, PageHeader, Select, THead, Th } from "@ark/ui"
import { useMonthlyReport, useUpdateMonthlyReport } from "@data/hooks"
import { createMemo, createSignal, For } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"
import { QueryBoundary, StatusBadge } from "@/components/ui"

type RowValue = {
  countedQuantity: number
  damagedQuantity: number
  condition: "good" | "damaged" | "for-repair" | "lost"
  notes?: string
}
export default function MonthlyReportPage() {
  const context = usePageContext()
  const id = createMemo(() => context.routeParams.id as string)
  const query = useMonthlyReport(id)
  const update = useUpdateMonthlyReport()
  const [values, setValues] = createSignal<Record<string, RowValue>>({})
  return (
    <PageContainer>
      <div class="mb-4">
        <BackLink href="/monthly">Back to Monthly Checklists</BackLink>
      </div>
      <QueryBoundary query={query}>
        {data => {
          const value = (line: (typeof data.lines)[number]) =>
            values()[line.line.id] ?? {
              countedQuantity: line.line.countedQuantity ?? line.line.expectedQuantity,
              damagedQuantity: line.line.damagedQuantity,
              condition: line.line.condition,
              notes: line.line.notes ?? undefined,
            }
          const submit = (complete: boolean) =>
            update.mutate({
              id: id(),
              complete,
              lines: data.lines.map(line => ({ id: line.line.id, ...value(line) })),
            })
          return (
            <>
              <PageHeader
                title={new Date(data.report.month).toLocaleDateString("en-PH", {
                  month: "long",
                  year: "numeric",
                })}
                subtitle="Count every existing item and record its physical condition"
                badge={<StatusBadge status={data.report.status} />}
              />
              <div class="overflow-x-auto rounded-lg border border-border bg-surface">
                <table class="w-full">
                  <THead>
                    <Th>Tool / Equipment</Th>
                    <Th>Expected</Th>
                    <Th>Counted</Th>
                    <Th>Damaged</Th>
                    <Th>Condition</Th>
                  </THead>
                  <tbody>
                    <For each={data.lines}>
                      {line => (
                        <tr class="border-t border-border">
                          <td class="px-5 py-3">
                            <p class="font-medium">{line.item.name}</p>
                            <p class="text-xs text-muted">
                              {line.item.category} · {line.item.assetTag || "catalog"}
                            </p>
                          </td>
                          <td class="px-5 py-3 text-sm">{line.line.expectedQuantity}</td>
                          <td class="px-5 py-3">
                            <input
                              type="number"
                              min="0"
                              value={value(line).countedQuantity}
                              onInput={event =>
                                setValues(all => ({
                                  ...all,
                                  [line.line.id]: {
                                    ...value(line),
                                    countedQuantity: Number(event.currentTarget.value),
                                  },
                                }))
                              }
                              class="w-24 rounded border border-border px-2 py-1 text-sm"
                            />
                          </td>
                          <td class="px-5 py-3">
                            <input
                              type="number"
                              min="0"
                              value={value(line).damagedQuantity}
                              onInput={event =>
                                setValues(all => ({
                                  ...all,
                                  [line.line.id]: {
                                    ...value(line),
                                    damagedQuantity: Number(event.currentTarget.value),
                                  },
                                }))
                              }
                              class="w-24 rounded border border-border px-2 py-1 text-sm"
                            />
                          </td>
                          <td class="px-5 py-3">
                            <Select
                              options={[
                                { label: "Good", value: "good" },
                                { label: "Damaged", value: "damaged" },
                                { label: "For repair", value: "for-repair" },
                                { label: "Lost", value: "lost" },
                              ]}
                              value={value(line).condition}
                              onChange={condition =>
                                setValues(all => ({
                                  ...all,
                                  [line.line.id]: {
                                    ...value(line),
                                    condition: condition as RowValue["condition"],
                                  },
                                }))
                              }
                              ariaLabel="Condition"
                            />
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
              <div class="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={data.report.status === "completed"}
                  onClick={() => submit(false)}
                  class="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  disabled={data.report.status === "completed"}
                  onClick={() => submit(true)}
                  class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Complete month
                </button>
              </div>
            </>
          )
        }}
      </QueryBoundary>
    </PageContainer>
  )
}
