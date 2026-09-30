import { formatDatePH, formatPeso, Icons, StatusBadge } from "@ark/ui"
import { useUpdateBatch } from "@data/hooks"
import { displayTrainingScheme } from "@data/scheme-label"
import type { Batch, BatchStatus } from "@data/types"
import { ChevronDown, GripVertical } from "lucide-solid"
import { createSignal, For, Show } from "solid-js"

const COLUMNS: BatchStatus[] = ["Not Started", "In Progress", "On Hold", "Completed"]

interface BatchKanbanProps {
  batches: Batch[]
  onOpen: (id: string) => void
}

export function BatchKanban(props: BatchKanbanProps) {
  const updateBatch = useUpdateBatch()
  const [hoverStatus, setHoverStatus] = createSignal<BatchStatus | null>(null)
  const [draggingId, setDraggingId] = createSignal<string | null>(null)
  const [collapsedStatuses, setCollapsedStatuses] = createSignal<Set<BatchStatus>>(new Set())

  const toggleCollapsed = (status: BatchStatus) => {
    setCollapsedStatuses(current => {
      const next = new Set(current)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }

  const moveBatch = (id: string, status: BatchStatus) => {
    const batch = props.batches.find(item => item.id === id)
    if (!batch || batch.status === status || updateBatch.isPending) return
    updateBatch.mutate({ id: batch.id, status })
  }

  return (
    <div class="overflow-x-auto pb-3">
      <div class="flex min-w-full items-start gap-4">
        <For each={COLUMNS}>
          {status => {
            const items = () => props.batches.filter(batch => batch.status === status)
            const collapsed = () => collapsedStatuses().has(status)
            return (
              <section
                aria-label={`${status} batches`}
                class={`${collapsed() ? "w-44 shrink-0" : "min-w-[280px] flex-1"} min-h-72 rounded-xl border p-3 transition-colors ${
                  hoverStatus() === status
                    ? "border-primary bg-primary/5"
                    : "border-border bg-surface-muted/40"
                }`}
                onDragOver={event => {
                  if (!draggingId()) return
                  event.preventDefault()
                  if (event.dataTransfer) event.dataTransfer.dropEffect = "move"
                  setHoverStatus(status)
                }}
                onDrop={event => {
                  event.preventDefault()
                  setHoverStatus(null)
                  moveBatch(draggingId() ?? "", status)
                  setDraggingId(null)
                }}
              >
                <button
                  type="button"
                  aria-label={`${collapsed() ? "Expand" : "Collapse"} ${status} column`}
                  aria-expanded={!collapsed()}
                  aria-controls={`batch-column-${status.replace(/ /g, "-")}`}
                  onClick={() => toggleCollapsed(status)}
                  class="mb-3 flex h-8 w-full items-center justify-between gap-2 rounded-md px-1 text-left hover:bg-surface-muted"
                >
                  <StatusBadge status={status} />
                  <span class="ml-auto rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-muted">
                    {items().length}
                  </span>
                  <ChevronDown
                    class={`h-4 w-4 shrink-0 text-muted transition-transform ${collapsed() ? "-rotate-90" : ""}`}
                  />
                </button>
                <div
                  id={`batch-column-${status.replace(/ /g, "-")}`}
                  hidden={collapsed()}
                  class="space-y-3"
                >
                  <For
                    each={items()}
                    fallback={
                      <div class="rounded-lg border border-dashed border-border px-3 py-8 text-center text-xs text-muted">
                        Drop a batch here
                      </div>
                    }
                  >
                    {batch => (
                      <article
                        draggable={!updateBatch.isPending}
                        onDragStart={event => {
                          setDraggingId(batch.id)
                          event.dataTransfer?.setData("text/plain", batch.id)
                          if (event.dataTransfer) event.dataTransfer.effectAllowed = "move"
                        }}
                        onDragEnd={() => {
                          setDraggingId(null)
                          setHoverStatus(null)
                        }}
                        class="w-full cursor-grab rounded-lg border border-border bg-surface p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow active:cursor-grabbing"
                      >
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
                          <span
                            aria-hidden="true"
                            title="Drag to another stage"
                            class="shrink-0 p-1 text-muted"
                          >
                            <GripVertical class="h-4 w-4" />
                          </span>
                          <Show when={batch.noticeToProceedUrl}>
                            <span title="Notice to Proceed attached">
                              <Icons.fileText class="h-4 w-4 text-green-600" />
                            </span>
                          </Show>
                        </div>
                        <p class="mt-2 text-xs font-medium text-muted">
                          {displayTrainingScheme(batch.trainingSchemeLabel)}
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
