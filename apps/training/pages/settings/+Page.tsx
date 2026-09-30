import { PageContainer, PageHeader } from "@ark/ui"
import { useCreateTrainingScheme, useTrainingSchemes, useUpdateTrainingScheme } from "@data/hooks"
import { createSignal, For, Show } from "solid-js"
import { QueryBoundary, StatusBadge } from "@/components/ui"

export default function TrainingSettingsPage() {
  const query = useTrainingSchemes(true)
  const createScheme = useCreateTrainingScheme()
  const updateScheme = useUpdateTrainingScheme()
  const [code, setCode] = createSignal("")
  const [label, setLabel] = createSignal("")
  const [notes, setNotes] = createSignal("")

  return (
    <PageContainer>
      <PageHeader
        title="Batch Settings"
        subtitle="Manage training schemes used by batches and Procurement expense rules"
      />
      <form
        class="mb-6 grid gap-3 rounded-lg border border-border bg-surface p-5 md:grid-cols-[1fr_1.5fr_2fr_auto]"
        onSubmit={event => {
          event.preventDefault()
          createScheme.mutate(
            {
              code: code().trim().toUpperCase().replace(/\s+/g, "-"),
              label: label().trim(),
              notes: notes().trim() || undefined,
            },
            {
              onSuccess: () => {
                setCode("")
                setLabel("")
                setNotes("")
              },
            }
          )
        }}
      >
        <input
          required
          value={code()}
          onInput={event => setCode(event.currentTarget.value)}
          placeholder="Scheme code"
          class="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <input
          required
          value={label()}
          onInput={event => setLabel(event.currentTarget.value)}
          placeholder="Display name"
          class="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <input
          value={notes()}
          onInput={event => setNotes(event.currentTarget.value)}
          placeholder="Notes (optional)"
          class="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={createScheme.isPending}
          class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Add Scheme
        </button>
      </form>
      <QueryBoundary query={query}>
        {schemes => (
          <div class="overflow-hidden rounded-lg border border-border bg-surface">
            <For each={schemes}>
              {scheme => (
                <div class="flex flex-wrap items-center gap-4 border-b border-border px-5 py-4 last:border-0 sm:grid sm:grid-cols-[1fr_auto_auto]">
                  <div>
                    <p class="font-medium">
                      {scheme.code === "LEGACY"
                        ? "Older batches — scheme not recorded"
                        : scheme.label}
                    </p>
                    <p class="text-xs text-muted">
                      {scheme.code === "LEGACY"
                        ? "Used for batches created before schemes were tracked. Choose the correct scheme when editing each batch."
                        : scheme.code}
                    </p>
                  </div>
                  <Show
                    when={scheme.code !== "LEGACY"}
                    fallback={
                      <span class="text-xs font-medium text-muted">Historical placeholder</span>
                    }
                  >
                    <StatusBadge status={scheme.active ? "active" : "inactive"} />
                    <button
                      type="button"
                      onClick={() => updateScheme.mutate({ id: scheme.id, active: !scheme.active })}
                      class="rounded-lg border border-border px-3 py-2 text-sm font-medium"
                    >
                      {scheme.active ? "Deactivate" : "Activate"}
                    </button>
                  </Show>
                </div>
              )}
            </For>
            <Show when={schemes.length === 0}>
              <p class="py-12 text-center text-sm text-muted">No training schemes configured.</p>
            </Show>
          </div>
        )}
      </QueryBoundary>
    </PageContainer>
  )
}
