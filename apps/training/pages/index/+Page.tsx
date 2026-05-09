import { THead, Th } from "@ark/ui"
import { useBatches } from "@data/hooks"
import type { Batch } from "@data/types"
import { createSignal, For, Show } from "solid-js"
import { AddBatchModal } from "@/components/modals"
import { Icons, StatusBadge } from "@/components/ui"

export default function BatchesPage() {
  const [showAddModal, setShowAddModal] = createSignal(false)
  const query = useBatches()

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8">
      <div class="max-w-6xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-2xl font-semibold text-foreground">Batches</h1>
            <p class="text-sm text-muted mt-1">{query.data?.length ?? 0} training batches</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            + New Batch
          </button>
        </div>

        <AddBatchModal open={showAddModal()} onClose={() => setShowAddModal(false)} />

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
            <div class="bg-surface rounded-lg border border-border overflow-hidden">
              <table class="w-full">
                <THead>
                  <Th>Batch</Th>
                  <Th>Training</Th>
                  <Th>Schedule</Th>
                  <Th>Students</Th>
                  <Th>Status</Th>
                </THead>
                <tbody>
                  <For each={query.data}>
                    {(batch: Batch) => (
                      <tr
                        class="border-t border-border hover:bg-primary/5 transition-colors cursor-pointer"
                        onClick={() => (window.location.href = `/batch/${batch.id}`)}
                      >
                        <td class="py-4 px-6">
                          <span class="text-sm font-medium text-foreground">{batch.batchCode}</span>
                        </td>
                        <td class="py-4 px-6">
                          <div>
                            <p class="text-sm text-foreground">{batch.trainingName}</p>
                            <p class="text-xs text-muted">{batch.senator}</p>
                          </div>
                        </td>
                        <td class="py-4 px-6">
                          <div class="flex items-center gap-1.5 text-sm text-muted">
                            <Icons.calendar class="w-3.5 h-3.5 text-muted" />
                            {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
                          </div>
                        </td>
                        <td class="py-4 px-6">
                          <div class="flex items-center gap-1.5 text-sm text-muted">
                            <Icons.users class="w-3.5 h-3.5 text-muted" />
                            {batch.studentsEnrolled}
                          </div>
                        </td>
                        <td class="py-4 px-6">
                          <StatusBadge status={batch.status} />
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  )
}
