import { formatDatePH, formatPeso, Icons, StatusBadge } from "@ark/ui"
import { useUpdateBatch } from "@data/hooks"
import type { Batch, BatchStatus } from "@data/types"
import { GripVertical } from "lucide-solid"
import { createSignal, For, Show } from "solid-js"

const COLUMNS: BatchStatus[] = ["Not Started", "In Progress", "On Hold", "Completed"]

interface BatchKanbanProps {
  batches: Batch[]
  onOpen: (id: string) => void
}

export function BatchKanban(props: BatchKanbanProps) {
  const updateBatch = useUpdateBatch()
  const [hoverStatus, setHoverStatus] = createSignal<BatchStatus | null>(null)

  const moveBatch = (id: string, status: BatchStatus) => {
    const batch = props.batches.find(item => item.id === id)
    if (!batch || batch.status === status || updateBatch.isPending) return
    updateBatch.mutate({ id: batch.id, status })
  }

  return (
    <div class="overflow-x-auto pb-3">
      <div class="grid min-w-[1160px] grid-cols-4 items-start gap-4">
        <For each={COLUMNS}>
          {status => {
            const items = () => props.batches.filter(batch => batch.status === status)
            return (
              <section
                aria-label={`${status} batches`}
                class={`min-h-72 rounded-xl border p-3 transition-colors ${
                  hoverStatus() === status
                    ? "border-primary bg-primary/5"
                    : "border-border bg-surface-muted/40"
                }`}
                onDragOver={event => {
                  event.preventDefault()
                  setHoverStatus(status)
                }}
                onDrop={event => {
                  event.preventDefault()
                  setHoverStatus(null)
                  moveBatch(event.dataTransfer?.getData("text/plain") ?? "", status)
                }}
              >
                <div class="mb-3 flex h-8 items-center justify-between gap-2 px-1">
                  <StatusBadge status={status} />
                  <span class="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-muted">
                    {items().length}
                  </span>
                </div>
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
                      <article class="w-full rounded-lg border border-border bg-surface p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow">
                        <div class="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => props.onOpen(batch.id)}
                            class="min-w-0 text-left hover:underline"
                          >
                            <span class="block truncate font-mono text-xs font-semibold text-primary">
                              {batch.batchCode}
                            </span>
                            <span class="mt-1 block text-sm font-semibold leading-5 text-foreground">
                              {batch.trainingOfferingLabel ?? batch.trainingName}
                            </span>
                          </button>
                          <button
                            type="button"
                            aria-label={`Drag ${batch.batchCode}`}
                            title="Drag to another stage"
                            draggable={!updateBatch.isPending}
                            onDragStart={event => {
                              event.dataTransfer?.setData("text/plain", batch.id)
                              if (event.dataTransfer) event.dataTransfer.effectAllowed = "move"
                            }}
                            onDragEnd={() => setHoverStatus(null)}
                            class="shrink-0 cursor-grab rounded p-1 text-muted hover:bg-surface-muted hover:text-foreground active:cursor-grabbing"
                          >
                            <GripVertical class="h-4 w-4" />
                          </button>
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
                        <div class="mt-3 space-y-1 border-t border-border pt-3 text-xs">
                          <div class="flex items-center justify-between gap-2 text-muted">
                            <span>Net budget</span>
                            <span class="font-semibold text-foreground">
                              {formatPeso(batch.netBudget)}
                            </span>
                          </div>
                          <div class="flex items-center justify-between gap-2 text-muted">
                            <span>Billing</span>
                            <span class="font-medium capitalize text-foreground">
                              {batch.billing?.status.replace("_", " ") ?? "Missing"}
                            </span>
                          </div>
                        </div>
                        <label class="mt-3 block text-xs text-muted">
                          Move to
                          <select
                            aria-label={`Move ${batch.batchCode} to`}
                            value={batch.status}
                            disabled={updateBatch.isPending}
                            onChange={event =>
                              moveBatch(batch.id, event.currentTarget.value as BatchStatus)
                            }
                            class="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-foreground disabled:opacity-50"
                          >
                            <For each={COLUMNS}>
                              {option => <option value={option}>{option}</option>}
                            </For>
                          </select>
                        </label>
                      </article>
                    )}
                  </For>
                </div>
              </section>
            )
          }}
        </For>
      </div>
    </div>
  )
}
