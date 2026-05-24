import type {
  AccountingTreatment,
  CostType,
  ExpenseCategory,
  ProfitCenter,
  TxnCategory,
} from "@ark/data-types"
import { BackLink, formatPeso, Select } from "@ark/ui"
import { categoryOptionsBySection, GL_CATALOG, glDefault } from "@data/gl-defaults"
import { useBankBalance, useCreateDisbursement } from "@data/hooks"
import {
  accountingTreatmentOptions,
  costTypeOptions,
  createDisbursementSchema,
  expenseCategoryOptions,
  profitCenterOptions,
} from "@data/schemas"
import { validateForm } from "@data/validate"
import { createMemo, createSignal, For, Show } from "solid-js"

const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  "cost-of-services": "Cost of Services",
  "admin-expense": "Admin Expense",
  "fixed-asset": "Fixed Asset",
}
const profitCenterLabels: Record<ProfitCenter, string> = {
  JDVP: "JDVP",
  "TWSP-FBS": "TWSP-FBS",
  "TWSP-HSK": "TWSP-HSK",
  Admin: "Admin",
}
const accountingTreatmentLabels: Record<AccountingTreatment, string> = {
  variable: "Variable",
  "traceable-fixed": "Traceable Fixed",
  "common-overhead": "Common / Overhead",
  capital: "Capital",
}
const costTypeLabels: Record<CostType, string> = {
  "FBS-variable": "FBS Variable",
  "HSK-variable": "HSK Variable",
  common: "Common",
}

export default function CreateDisbursementPage() {
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [category, setCategory] = createSignal<TxnCategory>("supplies")
  const [amount, setAmount] = createSignal("")
  const [description, setDescription] = createSignal("")
  const [referenceId, setReferenceId] = createSignal("")

  // 4 accounting-classification dropdowns. They start prefilled from the
  // initial category's defaults and re-prefill on category change UNLESS the
  // user has manually overridden a field.
  const initialDefaults = glDefault("supplies")
  const [expenseCategory, setExpenseCategory] = createSignal<ExpenseCategory | "">(
    initialDefaults?.expenseCategory ?? ""
  )
  const [profitCenter, setProfitCenter] = createSignal<ProfitCenter | "">("Admin")
  const [accountingTreatment, setAccountingTreatment] = createSignal<AccountingTreatment | "">(
    initialDefaults?.accountingTreatment ?? ""
  )
  const [costType, setCostType] = createSignal<CostType | "">("")
  const [touchedExpenseCat, setTouchedExpenseCat] = createSignal(false)
  const [touchedTreatment, setTouchedTreatment] = createSignal(false)

  const opsBalance = useBankBalance(() => "operational-hub")
  const mutation = useCreateDisbursement()

  const handleCategoryChange = (next: TxnCategory) => {
    setCategory(next)
    const def = glDefault(next)
    if (def) {
      if (!touchedExpenseCat()) setExpenseCategory(def.expenseCategory)
      if (!touchedTreatment()) setAccountingTreatment(def.accountingTreatment)
    }
  }

  const sectionGroups = createMemo(() => categoryOptionsBySection())

  const amountValue = () => {
    const v = parseFloat(amount())
    return Number.isNaN(v) ? 0 : v
  }
  const canSubmit = () => amountValue() > 0 && description().trim() !== "" && !mutation.isPending

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    if (!canSubmit()) return

    const data = {
      category: category(),
      amount: amountValue(),
      description: description(),
      referenceId: referenceId() || undefined,
      expenseCategory: expenseCategory() || undefined,
      profitCenter: profitCenter() || undefined,
      accountingTreatment: accountingTreatment() || undefined,
      costType: costType() || undefined,
    }

    const result = validateForm(createDisbursementSchema, data)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    mutation.mutate(
      {
        bankId: "operational-hub",
        ...result.data,
        referenceId: result.data.referenceId?.trim() || undefined,
      },
      {
        onSuccess: created => {
          // Fixed-asset disbursements get a follow-up: pre-fill the asset
          // register so finance doesn't have to retype name / cost / category.
          if (result.data.expenseCategory === "fixed-asset") {
            const params = new URLSearchParams({
              fromDisbursement: created.id,
              name: result.data.description,
              cost: String(result.data.amount),
              category: result.data.category,
              date: created.createdAt.slice(0, 10),
              ...(result.data.profitCenter ? { profitCenter: result.data.profitCenter } : {}),
            })
            window.location.href = `/assets/create?${params.toString()}`
            return
          }
          window.location.href = "/disbursements"
        },
      }
    )
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <div class="flex items-center gap-3 mb-8">
        <BackLink variant="icon" label="Back to disbursements" href="/disbursements" />
        <div>
          <h1 class="text-2xl font-semibold text-foreground">New Disbursement</h1>
          <p class="text-sm text-muted mt-1">
            Record a cash disbursement from Operational Hub. Pick a category — accounting
            classifications pre-fill from the matrix, you can override.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-surface rounded-lg border border-border p-6 space-y-4">
              <div>
                <label for="dis-category" class="block text-sm font-medium text-foreground mb-1">
                  Category (GL line item)
                </label>
                <select
                  id="dis-category"
                  value={category()}
                  onChange={e => handleCategoryChange(e.currentTarget.value as TxnCategory)}
                  class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().category ? "border-red-300" : "border-border"}`}
                >
                  <For each={sectionGroups()}>
                    {group => (
                      <Show when={group.options.length > 0}>
                        <optgroup label={group.label}>
                          <For each={group.options}>
                            {opt => <option value={opt.value}>{opt.label}</option>}
                          </For>
                        </optgroup>
                      </Show>
                    )}
                  </For>
                </select>
                <Show when={errors().category}>
                  <p class="text-xs text-red-600 mt-1">{errors().category}</p>
                </Show>
              </div>
              <div>
                <label for="dis-amount" class="block text-sm font-medium text-foreground mb-1">
                  Amount (PHP)
                </label>
                <input
                  id="dis-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount()}
                  onInput={e => setAmount(e.currentTarget.value)}
                  placeholder="0.00"
                  class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().amount ? "border-red-300" : "border-border"}`}
                />
                <Show when={errors().amount}>
                  <p class="text-xs text-red-600 mt-1">{errors().amount}</p>
                </Show>
              </div>
              <div>
                <label for="dis-description" class="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <input
                  id="dis-description"
                  type="text"
                  value={description()}
                  onInput={e => setDescription(e.currentTarget.value)}
                  placeholder="What was this expense for?"
                  class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().description ? "border-red-300" : "border-border"}`}
                />
                <Show when={errors().description}>
                  <p class="text-xs text-red-600 mt-1">{errors().description}</p>
                </Show>
              </div>
              <div>
                <label for="dis-reference" class="block text-sm font-medium text-foreground mb-1">
                  Reference <span class="text-muted">(optional)</span>
                </label>
                <input
                  id="dis-reference"
                  type="text"
                  value={referenceId()}
                  onInput={e => setReferenceId(e.currentTarget.value)}
                  placeholder="e.g., PO-001 or PR-2026-00042"
                  class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div class="bg-surface rounded-lg border border-border p-6 space-y-4">
              <div>
                <h2 class="text-lg font-semibold text-foreground">Accounting Classification</h2>
                <p class="text-xs text-muted mt-1">
                  Pre-filled from the category. Override only if this expense doesn't match the
                  default (e.g. an Internet Allowance that's actually for office IT, not training).
                </p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span class="block text-sm font-medium text-foreground mb-1">
                    Expense Category
                  </span>
                  <Select
                    options={expenseCategoryOptions.map(v => ({
                      label: expenseCategoryLabels[v],
                      value: v,
                    }))}
                    value={expenseCategory() || undefined}
                    onChange={v => {
                      setExpenseCategory(v as ExpenseCategory)
                      setTouchedExpenseCat(true)
                    }}
                    placeholder="—"
                    ariaLabel="Expense Category"
                  />
                </div>
                <div>
                  <span class="block text-sm font-medium text-foreground mb-1">Profit Center</span>
                  <Select
                    options={profitCenterOptions.map(v => ({
                      label: profitCenterLabels[v],
                      value: v,
                    }))}
                    value={profitCenter() || undefined}
                    onChange={v => setProfitCenter(v as ProfitCenter)}
                    placeholder="—"
                    ariaLabel="Profit Center"
                  />
                </div>
                <div>
                  <span class="block text-sm font-medium text-foreground mb-1">
                    Accounting Treatment
                  </span>
                  <Select
                    options={accountingTreatmentOptions.map(v => ({
                      label: accountingTreatmentLabels[v],
                      value: v,
                    }))}
                    value={accountingTreatment() || undefined}
                    onChange={v => {
                      setAccountingTreatment(v as AccountingTreatment)
                      setTouchedTreatment(true)
                    }}
                    placeholder="—"
                    ariaLabel="Accounting Treatment"
                  />
                </div>
                <div>
                  <span class="block text-sm font-medium text-foreground mb-1">Cost Type</span>
                  <Select
                    options={costTypeOptions.map(v => ({ label: costTypeLabels[v], value: v }))}
                    value={costType() || undefined}
                    onChange={v => setCostType(v as CostType)}
                    placeholder="—"
                    ariaLabel="Cost Type"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-1">
            <div class="bg-surface rounded-lg border border-border p-6 sticky top-24">
              <h2 class="text-lg font-semibold text-foreground mb-4">Summary</h2>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted">Bank</span>
                  <span class="font-medium">Operational Hub</span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-muted shrink-0">Line item</span>
                  <span class="font-medium text-right">
                    {GL_CATALOG[category()]?.label ?? category()}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Profit center</span>
                  <span class="font-medium">{profitCenter() || "—"}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Balance</span>
                  <span class="tabular-nums">
                    {opsBalance.data ? formatPeso(opsBalance.data.balance) : "-"}
                  </span>
                </div>
                <div class="border-t pt-3 flex justify-between">
                  <span class="font-medium">Amount</span>
                  <span class="text-xl tabular-nums text-red-700">
                    {amountValue() > 0 ? formatPeso(amountValue()) : "—"}
                  </span>
                </div>
              </div>

              <Show when={mutation.isError}>
                <div class="mt-4 p-3 bg-red-50 rounded-lg">
                  <p class="text-xs text-red-700">{mutation.error?.message}</p>
                </div>
              </Show>

              <div class="mt-6 space-y-3">
                <button
                  type="submit"
                  disabled={!canSubmit()}
                  class="w-full px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mutation.isPending ? "Processing..." : "Record Disbursement"}
                </button>
                <a
                  href="/disbursements"
                  class="block w-full px-4 py-2.5 bg-surface text-foreground border border-border text-sm font-medium rounded-lg hover:bg-surface-muted transition-colors text-center"
                >
                  Cancel
                </a>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
