import type { GlAccount, GlAccountSection } from "@ark/data-types"
import { Modal, ModalFooter, PageHeader, Select, tonePillClass } from "@ark/ui"
import {
  type CreateGlAccountInput,
  useCreateGlAccount,
  useDeactivateGlAccount,
  useGlAccounts,
  useUpdateGlAccount,
} from "@data/hooks"
import { createMemo, createSignal, For, Show } from "solid-js"

const SECTION_LABELS: Record<GlAccountSection, string> = {
  "cost-of-services": "Cost of Services",
  "admin-expense": "Admin Expense",
  "fixed-asset": "Fixed Asset",
  revenue: "Revenue",
  other: "Other",
}
const SECTION_ORDER: GlAccountSection[] = [
  "cost-of-services",
  "admin-expense",
  "fixed-asset",
  "revenue",
  "other",
]
const SECTION_OPTIONS = SECTION_ORDER.map(s => ({ label: SECTION_LABELS[s], value: s }))
const EXPENSE_CATEGORY_OPTIONS = [
  { label: "—", value: "" },
  { label: "Cost of Services", value: "cost-of-services" },
  { label: "Admin Expense", value: "admin-expense" },
  { label: "Fixed Asset", value: "fixed-asset" },
]
const TREATMENT_OPTIONS = [
  { label: "—", value: "" },
  { label: "Variable", value: "variable" },
  { label: "Traceable Fixed", value: "traceable-fixed" },
  { label: "Common / Overhead", value: "common-overhead" },
  { label: "Capital", value: "capital" },
]

const blankForm = (): CreateGlAccountInput => ({
  code: "",
  label: "",
  section: "cost-of-services",
  defaultExpenseCategory: null,
  defaultAccountingTreatment: null,
  sortOrder: 0,
})

export default function Page() {
  const query = useGlAccounts(() => ({ includeInactive: true }))
  const createM = useCreateGlAccount()
  const updateM = useUpdateGlAccount()
  const deactivateM = useDeactivateGlAccount()

  const [modalOpen, setModalOpen] = createSignal(false)
  const [editing, setEditing] = createSignal<GlAccount | null>(null)
  const [form, setForm] = createSignal<CreateGlAccountInput>(blankForm())

  const grouped = createMemo(() => {
    const all = query.data ?? []
    return SECTION_ORDER.map(section => ({
      section,
      label: SECTION_LABELS[section],
      rows: all
        .filter(a => a.section === section)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)),
    }))
  })

  const openCreate = () => {
    setEditing(null)
    setForm(blankForm())
    setModalOpen(true)
  }

  const openEdit = (acct: GlAccount) => {
    setEditing(acct)
    setForm({
      code: acct.code,
      label: acct.label,
      section: acct.section,
      defaultExpenseCategory: acct.defaultExpenseCategory ?? null,
      defaultAccountingTreatment: acct.defaultAccountingTreatment ?? null,
      notes: acct.notes ?? "",
      sortOrder: acct.sortOrder,
      active: acct.active,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const submit = (e: Event) => {
    e.preventDefault()
    const data = form()
    const payload = {
      ...data,
      defaultExpenseCategory: data.defaultExpenseCategory || null,
      defaultAccountingTreatment: data.defaultAccountingTreatment || null,
      notes: data.notes?.trim() || undefined,
    }
    const target = editing()
    if (target) {
      updateM.mutate({ id: target.id, ...payload }, { onSuccess: closeModal })
    } else {
      createM.mutate(payload, { onSuccess: closeModal })
    }
  }

  const handleDeactivate = (acct: GlAccount) => {
    if (!confirm(`Deactivate "${acct.label}"? Historical disbursements keep this code.`)) return
    deactivateM.mutate(acct.id)
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <PageHeader
        title="GL Accounts"
        subtitle="Chart of accounts that powers the disbursement form."
        action={
          <button
            type="button"
            onClick={openCreate}
            class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
          >
            + New Account
          </button>
        }
      />

      <Show
        when={!query.isLoading}
        fallback={<div class="animate-pulse h-64 bg-surface-muted rounded-lg mt-6" />}
      >
        <div class="space-y-6 mt-6">
          <For each={grouped()}>
            {group => (
              <Show when={group.rows.length > 0}>
                <section class="bg-surface rounded-lg border border-border overflow-hidden">
                  <header class="px-4 py-3 border-b border-border bg-surface-muted/50">
                    <h2 class="text-sm font-semibold text-foreground">{group.label}</h2>
                  </header>
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <thead class="text-xs uppercase text-muted">
                        <tr>
                          <th class="text-left px-4 py-2 font-medium">Code</th>
                          <th class="text-left px-4 py-2 font-medium">Label</th>
                          <th class="text-left px-4 py-2 font-medium">Default Treatment</th>
                          <th class="text-left px-4 py-2 font-medium">Status</th>
                          <th class="text-right px-4 py-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-border">
                        <For each={group.rows}>
                          {acct => (
                            <tr classList={{ "opacity-50": !acct.active }}>
                              <td class="px-4 py-2 font-mono text-xs text-muted">{acct.code}</td>
                              <td class="px-4 py-2 text-foreground">{acct.label}</td>
                              <td class="px-4 py-2 text-muted">
                                {acct.defaultAccountingTreatment ?? "—"}
                              </td>
                              <td class="px-4 py-2">
                                <Show
                                  when={acct.active}
                                  fallback={
                                    <span
                                      class={`text-xs px-2 py-0.5 rounded ${tonePillClass("negative")}`}
                                    >
                                      Inactive
                                    </span>
                                  }
                                >
                                  <span
                                    class={`text-xs px-2 py-0.5 rounded ${tonePillClass("positive")}`}
                                  >
                                    Active
                                  </span>
                                </Show>
                              </td>
                              <td class="px-4 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => openEdit(acct)}
                                  class="text-xs font-medium text-muted hover:text-primary px-2"
                                >
                                  Edit
                                </button>
                                <Show when={acct.active}>
                                  <button
                                    type="button"
                                    onClick={() => handleDeactivate(acct)}
                                    class="text-xs font-medium text-muted hover:text-red-500 px-2"
                                  >
                                    Deactivate
                                  </button>
                                </Show>
                              </td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </section>
              </Show>
            )}
          </For>
        </div>
      </Show>

      <Modal
        open={modalOpen()}
        onClose={closeModal}
        title={editing() ? "Edit GL Account" : "New GL Account"}
      >
        <form onSubmit={submit} class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="gl-code" class="block text-sm font-medium text-foreground mb-1">
                Code
              </label>
              <input
                id="gl-code"
                type="text"
                required
                value={form().code}
                onInput={e => setForm({ ...form(), code: e.currentTarget.value })}
                placeholder="e.g. internet"
                disabled={!!editing()}
                class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-surface-muted"
              />
              <Show when={editing()}>
                <p class="text-xs text-muted mt-1">Code is immutable after creation.</p>
              </Show>
            </div>
            <div>
              <label for="gl-label" class="block text-sm font-medium text-foreground mb-1">
                Label
              </label>
              <input
                id="gl-label"
                type="text"
                required
                value={form().label}
                onInput={e => setForm({ ...form(), label: e.currentTarget.value })}
                placeholder="e.g. Internet Allowance"
                class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <span class="block text-sm font-medium text-foreground mb-1">Section</span>
              <Select
                options={SECTION_OPTIONS}
                value={form().section}
                onChange={v => setForm({ ...form(), section: v as GlAccountSection })}
                ariaLabel="Section"
              />
            </div>
            <div>
              <label for="gl-sort" class="block text-sm font-medium text-foreground mb-1">
                Sort Order
              </label>
              <input
                id="gl-sort"
                type="number"
                value={form().sortOrder ?? 0}
                onInput={e => setForm({ ...form(), sortOrder: Number(e.currentTarget.value) || 0 })}
                class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <span class="block text-sm font-medium text-foreground mb-1">
                Default Expense Category
              </span>
              <Select
                options={EXPENSE_CATEGORY_OPTIONS}
                value={form().defaultExpenseCategory ?? ""}
                onChange={v =>
                  setForm({ ...form(), defaultExpenseCategory: (v as string) || null })
                }
                ariaLabel="Default Expense Category"
              />
            </div>
            <div>
              <span class="block text-sm font-medium text-foreground mb-1">Default Treatment</span>
              <Select
                options={TREATMENT_OPTIONS}
                value={form().defaultAccountingTreatment ?? ""}
                onChange={v =>
                  setForm({ ...form(), defaultAccountingTreatment: (v as string) || null })
                }
                ariaLabel="Default Treatment"
              />
            </div>
          </div>
          <div>
            <label for="gl-notes" class="block text-sm font-medium text-foreground mb-1">
              Notes <span class="text-muted">(optional)</span>
            </label>
            <textarea
              id="gl-notes"
              rows={2}
              value={form().notes ?? ""}
              onInput={e => setForm({ ...form(), notes: e.currentTarget.value })}
              class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <Show when={editing()}>
            <label class="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form().active ?? true}
                onChange={e => setForm({ ...form(), active: e.currentTarget.checked })}
              />
              <span class="text-foreground">Active</span>
            </label>
          </Show>
          <ModalFooter
            onCancel={closeModal}
            submitInForm
            submitLabel={editing() ? "Save" : "Create"}
            submitting={createM.isPending || updateM.isPending}
          />
        </form>
      </Modal>
    </div>
  )
}
