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
            <h1 class="text-2xl font-semibold text-gray-900">Batches</h1>
            <p class="text-sm text-gray-500 mt-1">{query.data?.length ?? 0} training batches</p>
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
              <div class="h-12 bg-gray-200 rounded" />
              <div class="h-64 bg-gray-200 rounded" />
            </div>
          }
        >
          <Show
            when={!query.isError}
            fallback={
              <div class="bg-white rounded-lg border border-gray-200 p-8 text-center">
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
            <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table class="w-full">
                <thead class="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th class="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Batch
                    </th>
                    <th class="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Training
                    </th>
                    <th class="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th class="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Students
                    </th>
                    <th class="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={query.data}>
                    {(batch: Batch) => (
                      <tr
                        class="border-t border-gray-100 hover:bg-primary/5 transition-colors cursor-pointer"
                        onClick={() => (window.location.href = `/batch/${batch.id}`)}
                      >
                        <td class="py-4 px-6">
                          <span class="text-sm font-medium text-gray-900">{batch.batchCode}</span>
                        </td>
                        <td class="py-4 px-6">
                          <div>
                            <p class="text-sm text-gray-900">{batch.trainingName}</p>
                            <p class="text-xs text-gray-500">{batch.senator}</p>
                          </div>
                        </td>
                        <td class="py-4 px-6">
                          <div class="flex items-center gap-1.5 text-sm text-gray-600">
                            <Icons.calendar class="w-3.5 h-3.5 text-gray-400" />
                            {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
                          </div>
                        </td>
                        <td class="py-4 px-6">
                          <div class="flex items-center gap-1.5 text-sm text-gray-600">
                            <Icons.users class="w-3.5 h-3.5 text-gray-400" />
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
