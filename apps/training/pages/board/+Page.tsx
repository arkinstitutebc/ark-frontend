import { Button, Icons, PageContainer, PageHeader, PageLoading } from "@ark/ui"
import { useBatches } from "@data/hooks"
import { createSignal, Show } from "solid-js"
import { navigate } from "vike/client/router"
import { BatchKanban } from "@/components/batch-kanban"
import { AddBatchModal } from "@/components/modals"

export default function BatchBoardPage() {
  const query = useBatches()
  const [showAddModal, setShowAddModal] = createSignal(false)
  const [openingBatchId, setOpeningBatchId] = createSignal<string | null>(null)
  const openBatch = (batchId: string) => {
    setOpeningBatchId(batchId)
    void navigate(`/batch/${batchId}`).catch(() => setOpeningBatchId(null))
  }

  return (
    <PageContainer maxWidth="max-w-none">
      <Show when={openingBatchId()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-surface/85 backdrop-blur-sm">
          <PageLoading label="Opening batch..." />
        </div>
      </Show>

      <PageHeader
        title="Batch Board"
        subtitle="Track training delivery. Drag a batch to another stage, or use its status menu."
        action={
          <Button type="button" size="sm" onClick={() => setShowAddModal(true)}>
            <Icons.plus class="h-4 w-4" />
            New Batch
          </Button>
        }
      />
      <AddBatchModal open={showAddModal()} onClose={() => setShowAddModal(false)} />

      <Show
        when={!query.isLoading}
        fallback={<div class="h-72 animate-pulse rounded-xl bg-surface-muted" />}
      >
        <Show
          when={!query.isError}
          fallback={
            <div class="rounded-xl border border-border bg-surface p-8 text-center">
              <p class="mb-2 text-sm text-red-600">{query.error?.message}</p>
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
          <BatchKanban batches={query.data ?? []} onOpen={openBatch} />
        </Show>
      </Show>
    </PageContainer>
  )
}
