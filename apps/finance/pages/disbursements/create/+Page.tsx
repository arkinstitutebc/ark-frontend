import type {
  AccountingTreatment,
  CostType,
  ExpenseCategory,
  GlAccountSection,
  ProfitCenter,
  TxnCategory,
} from "@ark/data-types"
import { BackLink, formatPeso, Select, type SelectOption } from "@ark/ui"
import {
  categoryOptionsBySection,
  GL_CATALOG,
  GL_SECTION_LABELS,
  GL_SECTIONS,
  glDefault,
} from "@data/gl-defaults"
import {
  useBankBalance,
  useClassificationRules,
  useCreateDisbursement,
  useGlAccounts,
  useProfitCenters,
} from "@data/hooks"
import {
  accountingTreatmentOptions,
  costTypeOptions,
  createDisbursementSchema,
  expenseCategoryOptions,
  profitCenterOptions,
} from "@data/schemas"
import { validateForm } from "@data/validate"
import { createEffect, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js"

const profitCenterLabels: Record<ProfitCenter, string> = {
  JDVP: "JDVP",
  "TWSP-FBS": "TWSP-FBS",
  "TWSP-HSK": "TWSP-HSK",
  Admin: "Admin",
}

const PREVIOUS_DISBURSEMENT_KEY = "ark-finance-previous-disbursement"
const DRAFT_DISBURSEMENT_KEY = "ark-finance-disbursement-draft"

interface PreviousDisbursementForm {
  category: TxnCategory
  transactionDate: string
  payee: string
  amount: string
  description: string
  referenceId: string
  expenseCategory: ExpenseCategory | ""
  profitCenter: string
  accountingTreatment: string
  costType: CostType | ""
  needsReview: boolean
}

const fallbackProfitCenterOptions = profitCenterOptions.map(v => ({
  label: profitCenterLabels[v],
  value: v,
}))

const validExpenseCategory = (value?: string | null): value is ExpenseCategory =>
  !!value && expenseCategoryOptions.includes(value as ExpenseCategory)

const validAccountingTreatment = (value?: string | null): value is AccountingTreatment =>
  !!value && accountingTreatmentOptions.includes(value as AccountingTreatment)

const validCostType = (value?: string | null): value is CostType =>
  !!value && costTypeOptions.includes(value as CostType)

export default function CreateDisbursementPage() {
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [category, setCategory] = createSignal<TxnCategory>("supplies")
  const [transactionDate, setTransactionDate] = createSignal(new Date().toISOString().slice(0, 10))
  const [payee, setPayee] = createSignal("")
  const [amount, setAmount] = createSignal("")
  const [description, setDescription] = createSignal("")
  const [referenceId, setReferenceId] = createSignal("")
  const [needsReview, setNeedsReview] = createSignal(false)
  const [hasPrevious, setHasPrevious] = createSignal(false)
  const [hasDraft, setHasDraft] = createSignal(false)
  let draftReady = false
  let draftTimer: ReturnType<typeof setTimeout> | undefined

  // Hidden accounting defaults keep the form simple while still feeding reports.
  const initialDefaults = glDefault("supplies")
  const [expenseCategory, setExpenseCategory] = createSignal<ExpenseCategory | "">(
    initialDefaults?.expenseCategory ?? ""
  )
  const [profitCenter, setProfitCenter] = createSignal("Admin")
  const [accountingTreatment, setAccountingTreatment] = createSignal(
    initialDefaults?.accountingTreatment ?? ""
  )
  const [costType, setCostType] = createSignal<CostType | "">("")

  const opsBalance = useBankBalance(() => "operational-hub")
  const glAccountsQuery = useGlAccounts(() => ({ includeInactive: false }))
  const profitCentersQuery = useProfitCenters(() => ({ includeInactive: false }))
  const classificationRulesQuery = useClassificationRules(() => ({ includeInactive: false }))
  const mutation = useCreateDisbursement()

  onMount(() => {
    setHasPrevious(!!window.localStorage.getItem(PREVIOUS_DISBURSEMENT_KEY))
    setHasDraft(!!window.localStorage.getItem(DRAFT_DISBURSEMENT_KEY))
    draftReady = true
  })

  onCleanup(() => {
    if (draftTimer) clearTimeout(draftTimer)
  })

  const classificationRule = (nextCategory = category(), nextProfitCenter = profitCenter()) => {
    const rules = classificationRulesQuery.data ?? []
    const matches = rules
      .filter(rule => rule.active && rule.glAccountCode === nextCategory)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    return (
      matches.find(rule => rule.profitCenterCode === nextProfitCenter) ??
      matches.find(rule => !rule.profitCenterCode) ??
      null
    )
  }

  const applyAccountingDefaults = (
    nextCategory = category(),
    nextProfitCenter = profitCenter(),
    syncReview = true
  ) => {
    const rule = classificationRule(nextCategory, nextProfitCenter)
    const fallback = glDefault(nextCategory)

    if (validExpenseCategory(rule?.defaultExpenseCategory)) {
      setExpenseCategory(rule.defaultExpenseCategory)
    } else {
      setExpenseCategory(fallback?.expenseCategory ?? "")
    }

    if (validAccountingTreatment(rule?.defaultAccountingTreatment)) {
      setAccountingTreatment(rule.defaultAccountingTreatment)
    } else {
      setAccountingTreatment(fallback?.accountingTreatment ?? "")
    }

    setCostType(validCostType(rule?.defaultCostType) ? rule.defaultCostType : "")
    if (syncReview) setNeedsReview(!!rule?.requiresAssetReview)
  }

  const handleCategoryChange = (next: TxnCategory) => {
    setCategory(next)
    applyAccountingDefaults(next, profitCenter())
  }

  createEffect(() => {
    applyAccountingDefaults(category(), profitCenter(), false)
  })

  const categoryLabel = (code: string) =>
    glAccountsQuery.data?.find(account => account.code === code)?.label ??
    GL_CATALOG[code as TxnCategory]?.label ??
    code

  const categoryOptions = createMemo<SelectOption<string>[]>(() => {
    const liveAccounts = (glAccountsQuery.data ?? [])
      .filter(account => account.active && account.section !== "revenue")
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))

    if (liveAccounts.length > 0) {
      const sections = [
        ...GL_SECTIONS,
        ...Array.from(new Set(liveAccounts.map(account => account.section))).filter(
          section => !GL_SECTIONS.includes(section as never)
        ),
      ] as GlAccountSection[]

      return sections.flatMap(section => {
        const accounts = liveAccounts.filter(account => account.section === section)
        if (accounts.length === 0) return []
        return [
          {
            label: GL_SECTION_LABELS[section as keyof typeof GL_SECTION_LABELS] ?? section,
            value: `group-${section}`,
            disabled: true,
          },
          ...accounts.map(account => ({ label: account.label, value: account.code })),
        ]
      })
    }

    return categoryOptionsBySection().flatMap(group => [
      { label: group.label, value: `group-${group.label}`, disabled: true },
      ...group.options,
    ])
  })

  const profitCenterSelectOptions = createMemo<SelectOption<string>[]>(() => {
    const liveCenters = (profitCentersQuery.data ?? [])
      .filter(center => center.active)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))

    if (liveCenters.length === 0) return fallbackProfitCenterOptions
    return liveCenters.map(center => ({ label: center.label, value: center.code }))
  })

  const amountValue = () => {
    const v = parseFloat(amount())
    return Number.isNaN(v) ? 0 : v
  }
  const projectedBalance = () => (opsBalance.data?.balance ?? 0) - amountValue()
  const canSubmit = () =>
    transactionDate().trim() !== "" &&
    amountValue() > 0 &&
    description().trim() !== "" &&
    !mutation.isPending

  const currentForm = (): PreviousDisbursementForm => ({
    category: category(),
    transactionDate: transactionDate(),
    payee: payee(),
    amount: amount(),
    description: description(),
    referenceId: referenceId(),
    expenseCategory: expenseCategory(),
    profitCenter: profitCenter(),
    accountingTreatment: accountingTreatment(),
    costType: costType(),
    needsReview: needsReview(),
  })

  createEffect(() => {
    const form = currentForm()
    if (!draftReady) return
    if (draftTimer) clearTimeout(draftTimer)
    draftTimer = setTimeout(() => {
      window.localStorage.setItem(DRAFT_DISBURSEMENT_KEY, JSON.stringify(form))
      setHasDraft(true)
    }, 250)
  })

  const applyForm = (form: PreviousDisbursementForm) => {
    setCategory(form.category)
    setTransactionDate(form.transactionDate || new Date().toISOString().slice(0, 10))
    setPayee(form.payee ?? "")
    setAmount(form.amount ?? "")
    setDescription(form.description ?? "")
    setReferenceId(form.referenceId ?? "")
    setExpenseCategory(form.expenseCategory ?? glDefault(form.category)?.expenseCategory ?? "")
    setProfitCenter(form.profitCenter || "Admin")
    setAccountingTreatment(
      form.accountingTreatment ?? glDefault(form.category)?.accountingTreatment ?? ""
    )
    setCostType(form.costType ?? "")
    setNeedsReview(!!form.needsReview)
  }

  const rememberCurrent = () => {
    window.localStorage.setItem(PREVIOUS_DISBURSEMENT_KEY, JSON.stringify(currentForm()))
    setHasPrevious(true)
  }

  const usePrevious = () => {
    const raw = window.localStorage.getItem(PREVIOUS_DISBURSEMENT_KEY)
    if (!raw) return
    try {
      applyForm(JSON.parse(raw) as PreviousDisbursementForm)
      setErrors({})
    } catch {
      window.localStorage.removeItem(PREVIOUS_DISBURSEMENT_KEY)
      setHasPrevious(false)
    }
  }

  const restoreDraft = () => {
    const raw = window.localStorage.getItem(DRAFT_DISBURSEMENT_KEY)
    if (!raw) return
    try {
      applyForm(JSON.parse(raw) as PreviousDisbursementForm)
      setErrors({})
    } catch {
      window.localStorage.removeItem(DRAFT_DISBURSEMENT_KEY)
      setHasDraft(false)
    }
  }

  const resetForNext = () => {
    setAmount("")
    setDescription("")
    setReferenceId("")
    setErrors({})
  }

  const submit = (afterSave: "list" | "again") => {
    if (!canSubmit()) return

    const data = {
      category: category(),
      transactionDate: transactionDate(),
      payee: payee().trim() || undefined,
      amount: amountValue(),
      description: description(),
      referenceId: referenceId() || undefined,
      expenseCategory: expenseCategory() || undefined,
      profitCenter: profitCenter() || undefined,
      accountingTreatment: accountingTreatment() || undefined,
      costType: costType() || undefined,
      needsReview: needsReview(),
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
        onSuccess: () => {
          rememberCurrent()
          if (afterSave === "again") {
            resetForNext()
            return
          }
          window.localStorage.removeItem(DRAFT_DISBURSEMENT_KEY)
          window.location.href = "/disbursements"
        },
      }
    )
  }

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    submit("list")
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <div class="flex items-center gap-3 mb-8">
        <BackLink variant="icon" label="Back to disbursements" href="/disbursements" />
        <div>
          <h1 class="text-2xl font-semibold text-foreground">New Disbursement</h1>
          <p class="text-sm text-muted mt-1">
            Add an old paid receipt or cash expense. Use Store / Company for who was paid.
          </p>
        </div>
        <Show when={hasPrevious()}>
          <button
            type="button"
            onClick={usePrevious}
            class="ml-auto px-3 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-surface-muted transition-colors"
          >
            Use previous
          </button>
        </Show>
        <Show when={hasDraft()}>
          <button
            type="button"
            onClick={restoreDraft}
            class={
              hasPrevious()
                ? "px-3 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-surface-muted transition-colors"
                : "ml-auto px-3 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-surface-muted transition-colors"
            }
          >
            Restore draft
          </button>
        </Show>
      </div>

      <form onSubmit={handleSubmit}>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-surface rounded-lg border border-border p-6 space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="dis-date" class="block text-sm font-medium text-foreground mb-1">
                    Date
                  </label>
                  <input
                    id="dis-date"
                    type="date"
                    value={transactionDate()}
                    onInput={e => setTransactionDate(e.currentTarget.value)}
                    class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().transactionDate ? "border-red-300" : "border-border"}`}
                  />
                  <Show when={errors().transactionDate}>
                    <p class="text-xs text-red-600 mt-1">{errors().transactionDate}</p>
                  </Show>
                </div>
                <div>
                  <label for="dis-payee" class="block text-sm font-medium text-foreground mb-1">
                    Store / Company <span class="text-muted">(optional)</span>
                  </label>
                  <input
                    id="dis-payee"
                    type="text"
                    value={payee()}
                    onInput={e => setPayee(e.currentTarget.value)}
                    placeholder="e.g. Wilcon, Meralco, contractor name"
                    class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().payee ? "border-red-300" : "border-border"}`}
                  />
                  <Show when={errors().payee}>
                    <p class="text-xs text-red-600 mt-1">{errors().payee}</p>
                  </Show>
                </div>
              </div>
              <div>
                <label for="dis-category" class="block text-sm font-medium text-foreground mb-1">
                  Category
                </label>
                <Select
                  id="dis-category"
                  value={category()}
                  onChange={v => handleCategoryChange(v as TxnCategory)}
                  options={categoryOptions()}
                  ariaLabel="Category"
                  class={errors().category ? "rounded-lg ring-1 ring-red-300" : ""}
                />
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
                  What was bought / paid?
                </label>
                <input
                  id="dis-description"
                  type="text"
                  value={description()}
                  onInput={e => setDescription(e.currentTarget.value)}
                  placeholder="e.g. cement and hollow blocks for annex"
                  class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().description ? "border-red-300" : "border-border"}`}
                />
                <Show when={errors().description}>
                  <p class="text-xs text-red-600 mt-1">{errors().description}</p>
                </Show>
              </div>
              <div>
                <label for="dis-reference" class="block text-sm font-medium text-foreground mb-1">
                  Receipt / OR number <span class="text-muted">(optional)</span>
                </label>
                <input
                  id="dis-reference"
                  type="text"
                  value={referenceId()}
                  onInput={e => setReferenceId(e.currentTarget.value)}
                  placeholder="e.g. OR 12345, Invoice 0081"
                  class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <label class="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={needsReview()}
                  onChange={e => setNeedsReview(e.currentTarget.checked)}
                  class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                Needs review
              </label>
            </div>

            <div class="bg-surface rounded-lg border border-border p-6 space-y-4">
              <div>
                <h2 class="text-lg font-semibold text-foreground">Where should this count?</h2>
                <p class="text-xs text-muted mt-1">
                  Pick Admin for general office expenses. Pick a program only when the receipt is
                  clearly for that program.
                </p>
              </div>
              <div class="max-w-sm">
                <span class="block text-sm font-medium text-foreground mb-1">For</span>
                <Select
                  options={profitCenterSelectOptions()}
                  value={profitCenter() || undefined}
                  onChange={v => {
                    setProfitCenter(v)
                    applyAccountingDefaults(category(), v)
                  }}
                  placeholder="—"
                  ariaLabel="For"
                />
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
                  <span class="text-muted shrink-0">Category</span>
                  <span class="font-medium text-right">{categoryLabel(category())}</span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-muted shrink-0">Store / Company</span>
                  <span class="font-medium text-right">{payee().trim() || "—"}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">For</span>
                  <span class="font-medium">{profitCenter() || "—"}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Balance</span>
                  <span class="tabular-nums">
                    {opsBalance.data ? formatPeso(opsBalance.data.balance) : "-"}
                  </span>
                </div>
                <Show when={amountValue() > 0 && opsBalance.data}>
                  <div class="flex justify-between gap-3">
                    <span class="text-muted">After recording</span>
                    <span
                      class={`tabular-nums font-medium ${projectedBalance() < 0 ? "text-red-700" : "text-foreground"}`}
                    >
                      {formatPeso(projectedBalance())}
                    </span>
                  </div>
                </Show>
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
                <button
                  type="button"
                  disabled={!canSubmit()}
                  onClick={() => submit("again")}
                  class="w-full px-4 py-2.5 bg-surface text-foreground border border-border text-sm font-medium rounded-lg hover:bg-surface-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save & Add Another
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
