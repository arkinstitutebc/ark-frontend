import { formatDatePH, formatPeso, THead, Th } from "@ark/ui"
import { useTrainers } from "@data/hooks"
import type { Trainer, TrainerStatus } from "@data/types"
import { createMemo, createSignal, For, Show } from "solid-js"
import { TrainerDetailModal } from "@/components/trainer-detail-modal"
import { Icons, QueryBoundary, StatusBadge } from "@/components/ui"

export default function Page() {
  const query = useTrainers()
  const [filter, setFilter] = createSignal<TrainerStatus | "all">("all")
  const [search, setSearch] = createSignal("")
  const [selectedTrainer, setSelectedTrainer] = createSignal<Trainer | null>(null)
  const [modalOpen, setModalOpen] = createSignal(false)

  const filteredTrainers = createMemo(() => {
    const data = query.data || []
    return data.filter(t => {
      const matchStatus = filter() === "all" || t.status === filter()
      const matchSearch =
        !search() ||
        t.name.toLowerCase().includes(search().toLowerCase()) ||
        (t.specialization || "").toLowerCase().includes(search().toLowerCase())
      return matchStatus && matchSearch
    })
  })

  const stats = createMemo(() => {
    const data = query.data || []
    return {
      total: data.length,
      active: data.filter(t => t.status === "active").length,
      onLeave: data.filter(t => t.status === "on-leave").length,
      inactive: data.filter(t => t.status === "inactive").length,
    }
  })

  const handleView = (trainer: Trainer) => {
    setSelectedTrainer(trainer)
    setModalOpen(true)
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-semibold text-foreground">Trainers</h1>
          <p class="text-sm text-muted mt-1">Manage trainer profiles and assignments</p>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted mb-1">Total</p>
          <p class="text-2xl text-foreground">{query.isSuccess ? stats().total : "-"}</p>
        </div>
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted mb-1">Active</p>
          <p class="text-2xl text-foreground">{query.isSuccess ? stats().active : "-"}</p>
        </div>
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted mb-1">On Leave</p>
          <p class="text-2xl text-foreground">{query.isSuccess ? stats().onLeave : "-"}</p>
        </div>
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted mb-1">Inactive</p>
          <p class="text-2xl text-foreground">{query.isSuccess ? stats().inactive : "-"}</p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <div class="relative flex-1">
          <Icons.search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name or specialization..."
            value={search()}
            onInput={e => setSearch(e.currentTarget.value)}
            class="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div class="flex gap-2">
          <For
            each={[
              { value: "all" as const, label: "All" },
              { value: "active" as const, label: "Active" },
              { value: "on-leave" as const, label: "On Leave" },
              { value: "inactive" as const, label: "Inactive" },
            ]}
          >
            {item => (
              <button
                type="button"
                onClick={() => setFilter(item.value)}
                class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter() === item.value ? "bg-primary text-white" : "bg-surface text-foreground border border-border hover:bg-surface-muted"}`}
              >
                {item.label}
              </button>
            )}
          </For>
        </div>
      </div>

      <QueryBoundary query={query}>
        {(_data: Trainer[]) => (
          <div class="bg-surface rounded-lg border border-border overflow-hidden">
            <Show
              when={filteredTrainers().length > 0}
              fallback={
                <div class="py-16 text-center">
                  <Icons.users class="w-12 h-12 mx-auto mb-3 text-muted" />
                  <p class="text-sm font-medium text-foreground">No trainers found</p>
                </div>
              }
            >
              <table class="w-full">
                <THead>
                  <Th>Name</Th>
                  <Th>Specialization</Th>
                  <Th align="right">Rate/hr</Th>
                  <Th>Status</Th>
                  <Th>Hired</Th>
                </THead>
                <tbody>
                  <For each={filteredTrainers()}>
                    {(trainer: Trainer) => (
                      <tr
                        onClick={() => handleView(trainer)}
                        class="border-t border-border hover:bg-surface-muted cursor-pointer transition-colors"
                      >
                        <td class="py-4 px-6">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Icons.user class="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p class="text-sm text-foreground">{trainer.name}</p>
                              <p class="text-xs text-muted">{trainer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td class="py-4 px-6 text-sm text-foreground">{trainer.specialization}</td>
                        <td class="py-4 px-6 text-right text-sm text-foreground">
                          {formatPeso(Number(trainer.hourlyRate))}
                        </td>
                        <td class="py-4 px-6">
                          <StatusBadge status={trainer.status} />
                        </td>
                        <td class="py-4 px-6 text-sm text-muted">
                          {trainer.hireDate ? formatDatePH(trainer.hireDate) : "-"}
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </Show>
          </div>
        )}
      </QueryBoundary>

      <TrainerDetailModal
        open={modalOpen()}
        onClose={() => setModalOpen(false)}
        trainer={selectedTrainer()}
      />
    </div>
  )
}
