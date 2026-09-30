import { PageContainer, PageHeader, Select } from "@ark/ui"
import { api } from "@data/api"
import { useCreateExpenseItem, useExpenseItems, useUpdateExpenseItem } from "@data/hooks"
import type { ProcurementExpenseType, ProcurementOperationsSubtype } from "@data/types"
import { createQuery } from "@tanstack/solid-query"
import { createSignal, For, Show } from "solid-js"
import { QueryBoundary, StatusBadge } from "@/components/ui"

export default function ExpenseSettingsPage() {
  const query = useExpenseItems(true)
  const createItem = useCreateExpenseItem()
  const updateItem = useUpdateExpenseItem()
  const settings = createQuery(() => ({
    queryKey: ["training-settings"],
    queryFn: () =>
      api<Array<{ id: string; code: string; label: string; active: boolean }>>(
        "/api/training/settings/schemes"
      ),
  }))
  const [code, setCode] = createSignal("")
  const [label, setLabel] = createSignal("")
  const [expenseType, setExpenseType] = createSignal<ProcurementExpenseType>("operations")
  const [subtype, setSubtype] = createSignal<ProcurementOperationsSubtype>("training_expense")
  const [specialRequest, setSpecialRequest] = createSignal(false)
  const [schemeIds, setSchemeIds] = createSignal<string[]>([])

  return (
    <PageContainer>
      <PageHeader
        title="Expense Settings"
        subtitle="Curate Operations and Assets request items, including batch-scheme restrictions"
      />
      <form
        class="mb-6 grid gap-3 rounded-lg border border-border bg-surface p-5 md:grid-cols-2"
        onSubmit={event => {
          event.preventDefault()
          createItem.mutate(
            {
              code: code().trim().toUpperCase().replace(/\s+/g, "_"),
              label: label().trim(),
              expenseType: expenseType(),
              operationsSubtype: expenseType() === "operations" ? subtype() : null,
              requiresSpecialRequestNote: specialRequest(),
              schemeIds: schemeIds(),
            },
            {
              onSuccess: () => {
                setCode("")
                setLabel("")
                setSchemeIds([])
                setSpecialRequest(false)
              },
            }
          )
        }}
      >
        <input
          required
          value={code()}
          onInput={event => setCode(event.currentTarget.value)}
          placeholder="Code, e.g. TRAINER_FEE"
          class="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <input
          required
          value={label()}
          onInput={event => setLabel(event.currentTarget.value)}
          placeholder="Display label"
          class="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <Select
          options={[
            { label: "Operations", value: "operations" },
            { label: "Assets", value: "assets" },
          ]}
          value={expenseType()}
          onChange={value => setExpenseType(value as ProcurementExpenseType)}
          ariaLabel="Expense type"
        />
        <Show when={expenseType() === "operations"} fallback={<div />}>
          <Select
            options={[
              { label: "Training Expense", value: "training_expense" },
              { label: "Company Overhead", value: "company_overhead" },
            ]}
            value={subtype()}
            onChange={value => setSubtype(value as ProcurementOperationsSubtype)}
            ariaLabel="Operations subtype"
          />
        </Show>
        <fieldset class="rounded-lg border border-border p-3 md:col-span-2">
          <legend class="px-1 text-sm font-medium">Available training schemes</legend>
          <p class="mb-2 text-xs text-muted">
            Leave all unchecked to make this item available to every scheme.
          </p>
          <div class="flex flex-wrap gap-3">
            <For each={settings.data ?? []}>
              {scheme => (
                <label class="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={schemeIds().includes(scheme.id)}
                    onChange={event =>
                      setSchemeIds(values =>
                        event.currentTarget.checked
                          ? [...values, scheme.id]
                          : values.filter(id => id !== scheme.id)
                      )
                    }
                  />
                  {scheme.label}
                </label>
              )}
            </For>
          </div>
        </fieldset>
        <label class="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={specialRequest()}
            onChange={event => setSpecialRequest(event.currentTarget.checked)}
          />
          Require a special-request explanation
        </label>
        <button
          type="submit"
          disabled={createItem.isPending}
          class="justify-self-end rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Add Expense Item
        </button>
      </form>

      <QueryBoundary query={query}>
        {items => (
          <div class="overflow-hidden rounded-lg border border-border bg-surface">
            <For each={items}>
              {item => (
                <div class="grid gap-3 border-b border-border px-5 py-4 last:border-0 md:grid-cols-[1fr_1fr_auto] md:items-center">
                  <div>
                    <p class="font-medium">{item.label}</p>
                    <p class="text-xs text-muted">{item.code}</p>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 text-sm">
                    <StatusBadge status={item.active ? "active" : "inactive"} />
                    <span>
                      {item.expenseType === "assets"
                        ? "Assets"
                        : item.operationsSubtype?.replace("_", " ")}
                    </span>
                    <Show when={item.schemeIds.length > 0}>
                      <span class="text-xs text-muted">
                        {item.schemeIds.length} scheme restriction(s)
                      </span>
                    </Show>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateItem.mutate({
                        id: item.id,
                        code: item.code,
                        label: item.label,
                        expenseType: item.expenseType,
                        operationsSubtype: item.operationsSubtype,
                        requiresSpecialRequestNote: item.requiresSpecialRequestNote,
                        active: !item.active,
                        sortOrder: item.sortOrder,
                        schemeIds: item.schemeIds,
                      })
                    }
                    class="rounded-lg border border-border px-3 py-2 text-sm font-medium"
                  >
                    {item.active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              )}
            </For>
          </div>
        )}
      </QueryBoundary>
    </PageContainer>
  )
}
