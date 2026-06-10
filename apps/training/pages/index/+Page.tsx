import {
  Button,
  formatDatePH,
  Icons,
  PageContainer,
  PageHeader,
  StatusBadge,
  THead,
  Th,
} from "@ark/ui"
import { useBatches } from "@data/hooks"
import type { Batch } from "@data/types"
import { createMemo, createSignal, For, Show } from "solid-js"
import { AddBatchModal } from "@/components/modals"

function rqmLabel(value: string) {
  const trimmed = value.trim()
  return /^rqm\b/i.test(trimmed) ? trimmed.replace(/^rqm\s*/i, "") : trimmed
}

function batchMeta(batch: Batch) {
  return [
    batch.batchNo ? batch.batchNo.trim() : null,
    batch.rqm ? `RQM ${rqmLabel(batch.rqm)}` : null,
  ]
    .filter(Boolean)
    .join(" · ")
}

export default function BatchesPage() {
  const [showAddModal, setShowAddModal] = createSignal(false)
  const query = useBatches()
  const batches = createMemo(() => query.data ?? [])
  const activeBatches = createMemo(
    () =>
      batches().filter(batch => batch.status === "Not Started" || batch.status === "In Progress")
        .length
  )
  const totalStudents = createMemo(() =>
    batches().reduce((sum, batch) => sum + batch.studentsEnrolled, 0)
  )

  return (
    <PageContainer>
      <PageHeader
        title="Batches"
        subtitle="Program delivery, class schedules, venues, trainers, and rosters."
        action={
          <Button type="button" size="sm" onClick={() => setShowAddModal(true)}>
            <Icons.plus class="h-4 w-4" />
            New Batch
          </Button>
        }
      />

      <AddBatchModal open={showAddModal()} onClose={() => setShowAddModal(false)} />

      <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="rounded-xl border border-border bg-surface p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-muted">Total batches</p>
          <p class="mt-2 text-2xl font-semibold text-foreground">{batches().length}</p>
        </div>
        <div class="rounded-xl border border-border bg-surface p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-muted">Active batches</p>
          <p class="mt-2 text-2xl font-semibold text-foreground">{activeBatches()}</p>
        </div>
        <div class="rounded-xl border border-border bg-surface p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-muted">Enrolled students</p>
          <p class="mt-2 text-2xl font-semibold text-foreground">{totalStudents()}</p>
        </div>
      </div>

      <Show
        when={!query.isLoading}
        fallback={
          <div class="animate-pulse space-y-3">
            <div class="h-12 bg-surface-muted rounded" />
            <div class="h-64 bg-surface-muted rounded" />
          </div>
        }
      >
        <Show
          when={!query.isError}
          fallback={
            <div class="bg-surface rounded-lg border border-border p-8 text-center">
              <p class="text-sm text-red-600 mb-2">{query.error?.message}</p>
              <button
                type="button"
                onClick={() => query.refetch()}
                class="text-sm text-primary hover:underline"
              >
                Retry
              </button>
            </div>
          }
        >
          <div class="bg-surface rounded-xl border border-border overflow-hidden">
            <div class="max-h-[640px] overflow-auto">
              <table class="w-full min-w-[1240px] table-fixed">
                <colgroup>
                  <col class="w-[320px]" />
                  <col class="w-[330px]" />
                  <col class="w-[270px]" />
                  <col class="w-[120px]" />
                  <col class="w-[90px]" />
                  <col class="w-[160px]" />
                </colgroup>
                <THead>
                  <Th>Batch</Th>
                  <Th>Training</Th>
                  <Th>Schedule</Th>
                  <Th>Venue</Th>
                  <Th>Students</Th>
                  <Th>Status</Th>
                </THead>
                <tbody>
                  <For each={batches()}>
                    {(batch: Batch) => (
                      <tr
                        class="border-t border-border hover:bg-primary/5 transition-colors cursor-pointer"
                        onClick={() => (window.location.href = `/batch/${batch.id}`)}
                      >
                        <td class="py-4 px-5 align-middle">
                          <div class="min-w-0">
                            <span class="block truncate font-mono text-sm font-semibold text-foreground">
                              {batch.batchCode}
                            </span>
                            <Show when={batchMeta(batch)}>
                              {meta => (
                                <p
                                  class="mt-1 truncate text-xs font-medium text-muted"
                                  title={meta()}
                                >
                                  {meta()}
                                </p>
                              )}
                            </Show>
                          </div>
                        </td>
                        <td class="py-4 px-5 align-middle">
                          <div class="min-w-0">
                            <p class="text-sm font-medium leading-5 text-foreground">
                              {batch.trainingName}
                            </p>
                            <p class="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                              {batch.senator}
                            </p>
                          </div>
                        </td>
                        <td class="py-4 px-5 align-middle">
                          <div class="min-w-0 space-y-1.5">
                            <div class="flex items-start gap-1.5 text-sm leading-5 text-muted">
                              <Icons.calendar class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted" />
                              <span>
                                {formatDatePH(batch.startDate)} - {formatDatePH(batch.endDate)}
                              </span>
                            </div>
                            <Show when={batch.weeklySchedule}>
                              <p class="text-xs font-medium leading-5 text-muted">
                                {batch.weeklySchedule}
                              </p>
                            </Show>
                          </div>
                        </td>
                        <td class="py-4 px-5 align-middle text-sm text-muted">
                          <span class="block truncate" title={batch.venue}>
                            {batch.venue}
                          </span>
                        </td>
                        <td class="py-4 px-5 align-middle">
                          <div class="flex items-center gap-1.5 whitespace-nowrap text-sm text-muted">
                            <Icons.users class="h-3.5 w-3.5 text-muted" />
                            {batch.studentsEnrolled}
                          </div>
                        </td>
                        <td class="py-4 px-5 align-middle whitespace-nowrap [&>span]:whitespace-nowrap">
                          <StatusBadge status={batch.status} />
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </div>
        </Show>
      </Show>
    </PageContainer>
  )
}
