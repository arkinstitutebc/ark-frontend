import { formatDatePH, formatPeso, Icons, StatusBadge } from "@ark/ui"
import { useUpdateBatch } from "@data/hooks"
import type { Batch, BatchStatus } from "@data/types"
import { For, Show } from "solid-js"

const COLUMNS: BatchStatus[] = ["Not Started", "In Progress", "On Hold", "Completed"]

interface BatchKanbanProps {
  batches: Batch[]
  onOpen: (id: string) => void
}

export function BatchKanban(props: BatchKanbanProps) {
  const updateBatch = useUpdateBatch()

  const moveBatch = (event: DragEvent, status: BatchStatus) => {
    event.preventDefault()
    const id = event.dataTransfer?.getData("text/batch-id")
    const batch = props.batches.find(item => item.id === id)
    if (!batch || batch.status === status) return
    updateBatch.mutate({ id: batch.id, status })
  }

  return (
    <div class="grid gap-4 overflow-x-auto pb-2 lg:grid-cols-4">
      <For each={COLUMNS}>
        {status => {
          const items = () => props.batches.filter(batch => batch.status === status)
          return (
            <fieldset
              class="min-w-[280px] rounded-xl border border-border bg-surface-muted/40 p-3"
              onDragOver={event => event.preventDefault()}
              onDrop={event => moveBatch(event, status)}
            >
              <legend class="mb-3 flex w-full items-center justify-between px-1">
                <StatusBadge status={status} />
                <span class="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-muted">
                  {items().length}
                </span>
              </legend>
              <div class="space-y-3">
                <For
                  each={items()}
                  fallback={
                    <div class="rounded-lg border border-dashed border-border px-3 py-8 text-center text-xs text-muted">
                      Drop a batch here
                    </div>
                  }
                >
                  {batch => (
                    <button
                      type="button"
                      draggable
                      onDragStart={event => event.dataTransfer?.setData("text/batch-id", batch.id)}
                      onClick={() => props.onOpen(batch.id)}
                      class="cursor-pointer rounded-lg border border-border bg-surface p-4 shadow-sm transition hover:border-primary/40 hover:shadow"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="truncate font-mono text-xs font-semibold text-primary">
                            {batch.batchCode}
                          </p>
                          <h3 class="mt-1 text-sm font-semibold leading-5 text-foreground">
                            {batch.trainingOfferingLabel ?? batch.trainingName}
                          </h3>
                        </div>
                        <Show when={batch.noticeToProceedUrl}>
                          <span title="Notice to Proceed attached">
                            <Icons.fileText class="h-4 w-4 text-green-600" />
                          </span>
                        </Show>
                      </div>
                      <p class="mt-2 text-xs font-medium text-muted">
                        {batch.trainingSchemeLabel ?? "Legacy / Unspecified"}
                      </p>
                      <div class="mt-3 space-y-1.5 text-xs text-muted">
                        <p>
                          {formatDatePH(batch.startDate)} – {formatDatePH(batch.endDate)}
                        </p>
                        <p>{batch.instructor || "No trainer assigned"}</p>
                        <p>
                          {batch.studentsEnrolled} enrolled · {batch.venue}
                        </p>
                      </div>
                      <div class="mt-3 border-t border-border pt-3 text-xs">
                        <div class="flex justify-between text-muted">
                          <span>Net budget</span>
                          <span class="font-semibold text-foreground">
                            {formatPeso(batch.netBudget)}
                          </span>
                        </div>
                        <div class="mt-1 flex justify-between text-muted">
                          <span>Billing</span>
                          <span class="font-medium capitalize text-foreground">
                            {batch.billing?.status.replace("_", " ") ?? "Missing"}
                          </span>
                        </div>
                      </div>
                    </button>
                  )}
                </For>
              </div>
            </fieldset>
          )
        }}
      </For>
    </div>
  )
}
