import type {
  AccountingTreatment,
  CostType,
  ExpenseCategory,
  PrAttachment,
  ProfitCenter,
  RrItem,
  RrSupportingDocs,
} from "@ark/data-types"
import { BackLink, formatPeso, Icons, PageContainer, Select } from "@ark/ui"
import { useCreateRr, useCurrentUser } from "@data/hooks"
import {
  accountingTreatmentOptions,
  costTypeOptions,
  createRrSchema,
  expenseCategoryOptions,
  profitCenterOptions,
} from "@data/schemas"
import { validateForm } from "@data/validate"
import { createEffect, createMemo, createSignal, Index, type JSX, Show } from "solid-js"
import { navigate } from "vike/client/router"
import { AttachmentUploader } from "@/components/attachment-uploader"

interface ItemRow extends RrItem {
  id: string
}

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

export default function CreateRrPage() {
  const me = useCurrentUser()
  const createMutation = useCreateRr()

  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [claimantName, setClaimantName] = createSignal("")
  const [claimantPosition, setClaimantPosition] = createSignal("")
  const [claimantDepartment, setClaimantDepartment] = createSignal("")
  const [activity, setActivity] = createSignal("")
  const [schoolPartner, setSchoolPartner] = createSignal("")
  const [dateFiled, setDateFiled] = createSignal(new Date().toISOString().slice(0, 10))
  const [periodStart, setPeriodStart] = createSignal("")
  const [periodEnd, setPeriodEnd] = createSignal("")
  const [referencedPrCode, setReferencedPrCode] = createSignal("")
  const [expenseCategory, setExpenseCategory] = createSignal<ExpenseCategory | "">("")
  const [profitCenter, setProfitCenter] = createSignal<ProfitCenter | "">("")
  const [accountingTreatment, setAccountingTreatment] = createSignal<AccountingTreatment | "">("")
  const [costType, setCostType] = createSignal<CostType | "">("")
  const [items, setItems] = createSignal<ItemRow[]>([
    { id: "1", date: "", description: "", receiptNo: "", amount: 0, hasReceipt: false },
  ])
  const [amountInWords, setAmountInWords] = createSignal("")
  const [attachments, setAttachments] = createSignal<PrAttachment[]>([])
  const [supportingDocs, setSupportingDocs] = createSignal<RrSupportingDocs>({
    receipts: false,
    deliveryReceipt: false,
    quotation: false,
    prRef: false,
    activity: false,
    other: "",
    noReceiptsExplanation: "",
  })
  const toggleDoc = (key: keyof RrSupportingDocs) =>
    setSupportingDocs(prev => ({ ...prev, [key]: !prev[key] }))

  createEffect(() => {
    const u = me.data
    if (u && !claimantName()) {
      const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ").trim()
      setClaimantName(fullName || u.email)
    }
  })

  const total = createMemo(() =>
    items().reduce((sum, it) => sum + (Number.isFinite(it.amount) ? it.amount : 0), 0)
  )

  const addItem = () =>
    setItems(prev => [
      ...prev,
      {
        id: String(Date.now()),
        date: "",
        description: "",
        receiptNo: "",
        amount: 0,
        hasReceipt: false,
      },
    ])
  const removeItem = (id: string) =>
    setItems(prev => (prev.length > 1 ? prev.filter(it => it.id !== id) : prev))
  const updateItem = <K extends keyof ItemRow>(id: string, key: K, value: ItemRow[K]) =>
    setItems(prev => prev.map(it => (it.id === id ? { ...it, [key]: value } : it)))

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    const validItems = items()
      .filter(it => it.description.trim() && it.amount > 0)
      .map(it => ({
        date: it.date || undefined,
        description: it.description,
        receiptNo: it.receiptNo || undefined,
        amount: it.amount,
        hasReceipt: it.hasReceipt,
      }))

    const data = {
      claimantName: claimantName(),
      claimantPosition: claimantPosition() || undefined,
      claimantDepartment: claimantDepartment() || undefined,
      activity: activity() || undefined,
      schoolPartner: schoolPartner() || undefined,
      dateFiled: dateFiled(),
      periodStart: periodStart() || undefined,
      periodEnd: periodEnd() || undefined,
      referencedPrCode: referencedPrCode() || undefined,
      expenseCategory: expenseCategory(),
      profitCenter: profitCenter(),
      accountingTreatment: accountingTreatment(),
      costType: costType(),
      items: validItems,
      amountInWords: amountInWords() || undefined,
    }

    const result = validateForm(createRrSchema, data)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    const docs = supportingDocs()
    const hasAnyDoc =
      docs.receipts ||
      docs.deliveryReceipt ||
      docs.quotation ||
      docs.prRef ||
      docs.activity ||
      (docs.other ?? "").trim() ||
      (docs.noReceiptsExplanation ?? "").trim()

    createMutation.mutate(
      {
        ...data,
        expenseCategory: data.expenseCategory as ExpenseCategory,
        profitCenter: data.profitCenter as ProfitCenter,
        accountingTreatment: data.accountingTreatment as AccountingTreatment,
        costType: data.costType as CostType,
        totalAmount: String(total()),
        attachments: attachments().length > 0 ? attachments() : undefined,
        supportingDocs: hasAnyDoc
          ? {
              ...docs,
              other: docs.other?.trim() || undefined,
              noReceiptsExplanation: docs.noReceiptsExplanation?.trim() || undefined,
            }
          : undefined,
      },
      { onSuccess: () => navigate("/reimbursements") }
    )
  }

  return (
    <PageContainer>
      <div class="flex items-center gap-3 mb-8">
        <BackLink
          variant="icon"
          label="Back to claims"
          onClick={() => navigate("/reimbursements")}
        />
        <div>
          <h1 class="text-2xl font-semibold text-foreground">New Reimbursement Claim</h1>
          <p class="text-sm text-muted mt-1">
            Submit an out-of-pocket expense claim for verification.
          </p>
        </div>
      </div>

      <Show when={createMutation.isError}>
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Error: {createMutation.error?.message}
        </div>
      </Show>

      <form onSubmit={handleSubmit}>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-surface rounded-lg border border-border p-6">
              <h2 class="text-lg font-semibold text-foreground mb-4">Claimant</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Name" required error={errors().claimantName}>
                  <input
                    type="text"
                    value={claimantName()}
                    onInput={e => setClaimantName(e.currentTarget.value)}
                    class={inputCls(errors().claimantName)}
                  />
                </Field>
                <Field label="Position / Role">
                  <input
                    type="text"
                    value={claimantPosition()}
                    onInput={e => setClaimantPosition(e.currentTarget.value)}
                    placeholder="e.g. Operations Coordinator"
                    class={inputCls()}
                  />
                </Field>
                <Field label="Department">
                  <input
                    type="text"
                    value={claimantDepartment()}
                    onInput={e => setClaimantDepartment(e.currentTarget.value)}
                    placeholder="e.g. Training"
                    class={inputCls()}
                  />
                </Field>
                <Field label="Date Filed" required error={errors().dateFiled}>
                  <input
                    type="date"
                    value={dateFiled()}
                    onInput={e => setDateFiled(e.currentTarget.value)}
                    class={inputCls(errors().dateFiled)}
                  />
                </Field>
              </div>
            </div>

            <div class="bg-surface rounded-lg border border-border p-6">
              <h2 class="text-lg font-semibold text-foreground mb-4">Context</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Activity / Event">
                  <input
                    type="text"
                    value={activity()}
                    onInput={e => setActivity(e.currentTarget.value)}
                    placeholder="e.g. NC-II Bartending intake"
                    class={inputCls()}
                  />
                </Field>
                <Field label="School / Partner Covered">
                  <input
                    type="text"
                    value={schoolPartner()}
                    onInput={e => setSchoolPartner(e.currentTarget.value)}
                    class={inputCls()}
                  />
                </Field>
                <Field label="Period Start">
                  <input
                    type="date"
                    value={periodStart()}
                    onInput={e => setPeriodStart(e.currentTarget.value)}
                    class={inputCls()}
                  />
                </Field>
                <Field label="Period End">
                  <input
                    type="date"
                    value={periodEnd()}
                    onInput={e => setPeriodEnd(e.currentTarget.value)}
                    class={inputCls()}
                  />
                </Field>
                <Field label="Referenced PR (optional)">
                  <input
                    type="text"
                    value={referencedPrCode()}
                    onInput={e => setReferencedPrCode(e.currentTarget.value)}
                    placeholder="PR-2026-NNNNN"
                    class={inputCls()}
                  />
                </Field>
              </div>
            </div>

            <div class="bg-surface rounded-lg border border-border p-6">
              <h2 class="text-lg font-semibold text-foreground mb-1">Accounting Classification</h2>
              <p class="text-xs text-muted mb-4">Used by finance for the segmented P&amp;L.</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Expense Category" required error={errors().expenseCategory}>
                  <Select
                    options={expenseCategoryOptions.map(v => ({
                      label: expenseCategoryLabels[v],
                      value: v,
                    }))}
                    value={expenseCategory() || undefined}
                    onChange={v => setExpenseCategory(v as ExpenseCategory)}
                    placeholder="Select expense category"
                    ariaLabel="Expense Category"
                  />
                </Field>
                <Field label="Profit Center" required error={errors().profitCenter}>
                  <Select
                    options={profitCenterOptions.map(v => ({
                      label: profitCenterLabels[v],
                      value: v,
                    }))}
                    value={profitCenter() || undefined}
                    onChange={v => setProfitCenter(v as ProfitCenter)}
                    placeholder="Select profit center"
                    ariaLabel="Profit Center"
                  />
                </Field>
                <Field label="Accounting Treatment" required error={errors().accountingTreatment}>
                  <Select
                    options={accountingTreatmentOptions.map(v => ({
                      label: accountingTreatmentLabels[v],
                      value: v,
                    }))}
                    value={accountingTreatment() || undefined}
                    onChange={v => setAccountingTreatment(v as AccountingTreatment)}
                    placeholder="Select treatment"
                    ariaLabel="Accounting Treatment"
                  />
                </Field>
                <Field label="Cost Type" required error={errors().costType}>
                  <Select
                    options={costTypeOptions.map(v => ({ label: costTypeLabels[v], value: v }))}
                    value={costType() || undefined}
                    onChange={v => setCostType(v as CostType)}
                    placeholder="Select cost type"
                    ariaLabel="Cost Type"
                  />
                </Field>
              </div>
            </div>

            <div class="bg-surface rounded-lg border border-border p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-foreground">Expense Items</h2>
                <button
                  type="button"
                  onClick={addItem}
                  class="px-3 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg"
                >
                  + Add Item
                </button>
              </div>
              <Show when={errors().items}>
                <p class="text-xs text-red-600 mb-2">{errors().items}</p>
              </Show>
              <div class="space-y-4">
                <Index each={items()}>
                  {(item, idx) => (
                    <div class="border border-border rounded-lg p-4 space-y-3">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-foreground">Item {idx + 1}</span>
                        <Show when={items().length > 1}>
                          <button
                            type="button"
                            onClick={() => removeItem(item().id)}
                            class="text-red-500 hover:text-red-700"
                          >
                            <Icons.trash class="w-4 h-4" />
                          </button>
                        </Show>
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <label class="block sm:col-span-1">
                          <span class="block text-xs text-muted mb-1">Date</span>
                          <input
                            type="date"
                            value={item().date ?? ""}
                            onInput={e => updateItem(item().id, "date", e.currentTarget.value)}
                            class={inputCls()}
                          />
                        </label>
                        <label class="block sm:col-span-2">
                          <span class="block text-xs text-muted mb-1">Description</span>
                          <input
                            type="text"
                            value={item().description}
                            onInput={e =>
                              updateItem(item().id, "description", e.currentTarget.value)
                            }
                            class={inputCls()}
                          />
                        </label>
                        <label class="block sm:col-span-1">
                          <span class="block text-xs text-muted mb-1">Receipt #</span>
                          <input
                            type="text"
                            value={item().receiptNo ?? ""}
                            onInput={e => updateItem(item().id, "receiptNo", e.currentTarget.value)}
                            class={inputCls()}
                          />
                        </label>
                        <label class="block sm:col-span-1">
                          <span class="block text-xs text-muted mb-1">Amount (PHP)</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item().amount || ""}
                            onInput={e =>
                              updateItem(
                                item().id,
                                "amount",
                                Number.parseFloat(e.currentTarget.value) || 0
                              )
                            }
                            class={inputCls()}
                          />
                        </label>
                        <label class="flex items-center gap-2 text-sm text-foreground sm:col-span-3">
                          <input
                            type="checkbox"
                            checked={!!item().hasReceipt}
                            onChange={e =>
                              updateItem(item().id, "hasReceipt", e.currentTarget.checked)
                            }
                            class="accent-primary"
                          />
                          Has official receipt
                        </label>
                      </div>
                    </div>
                  )}
                </Index>
              </div>
              <div class="mt-4">
                <label for="amount-words" class="block text-xs text-muted mb-1">
                  Amount in words (optional)
                </label>
                <input
                  id="amount-words"
                  type="text"
                  value={amountInWords()}
                  onInput={e => setAmountInWords(e.currentTarget.value)}
                  placeholder="e.g. One thousand five hundred Philippine Pesos only"
                  class={inputCls()}
                />
              </div>
            </div>

            <div class="bg-surface rounded-lg border border-border p-6">
              <h2 class="text-lg font-semibold text-foreground mb-1">Supporting Documents</h2>
              <p class="text-xs text-muted mb-4">
                Tick what's attached. Receipts required for amounts ≥ ₱300.
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DocCheckbox
                  label="Official Receipts / Invoice"
                  checked={!!supportingDocs().receipts}
                  onToggle={() => toggleDoc("receipts")}
                />
                <DocCheckbox
                  label="Approved Purchase Request (ref. PR No.)"
                  checked={!!supportingDocs().prRef}
                  onToggle={() => toggleDoc("prRef")}
                />
                <DocCheckbox
                  label="Signed Delivery Receipt"
                  checked={!!supportingDocs().deliveryReceipt}
                  onToggle={() => toggleDoc("deliveryReceipt")}
                />
                <DocCheckbox
                  label="Activity Report / Training Attendance Sheet"
                  checked={!!supportingDocs().activity}
                  onToggle={() => toggleDoc("activity")}
                />
                <DocCheckbox
                  label="Quotation / Canvass Sheet"
                  checked={!!supportingDocs().quotation}
                  onToggle={() => toggleDoc("quotation")}
                />
              </div>
              <div class="mt-4 space-y-3">
                <label class="block">
                  <span class="block text-xs text-muted mb-1">Other (specify)</span>
                  <input
                    type="text"
                    value={supportingDocs().other ?? ""}
                    onInput={e => setSupportingDocs(p => ({ ...p, other: e.currentTarget.value }))}
                    placeholder="e.g. Travel itinerary, signed waiver…"
                    class={inputCls()}
                  />
                </label>
                <label class="block">
                  <span class="block text-xs text-muted mb-1">
                    No receipts available — explanation
                  </span>
                  <textarea
                    rows={2}
                    value={supportingDocs().noReceiptsExplanation ?? ""}
                    onInput={e =>
                      setSupportingDocs(p => ({
                        ...p,
                        noReceiptsExplanation: e.currentTarget.value,
                      }))
                    }
                    placeholder="If receipts couldn't be obtained, describe why (per Ark policy)."
                    class={`${inputCls()} resize-none`}
                  />
                </label>
              </div>
            </div>

            <div class="bg-surface rounded-lg border border-border p-6">
              <h2 class="text-lg font-semibold text-foreground mb-1">Attachments</h2>
              <p class="text-xs text-muted mb-3">
                Optional — upload receipt photos, supplier quotes, or invoices.
              </p>
              <AttachmentUploader attachments={attachments()} onChange={setAttachments} />
            </div>
          </div>

          <div class="lg:col-span-1">
            <div class="bg-surface rounded-lg border border-border p-6 sticky top-24">
              <h2 class="text-lg font-semibold text-foreground mb-4">Summary</h2>
              <div class="flex justify-between text-sm mb-3">
                <span class="text-muted">Items</span>
                <span class="font-medium text-foreground">
                  {items().filter(it => it.description.trim()).length}
                </span>
              </div>
              <div class="border-t border-border pt-3 flex justify-between">
                <span class="text-foreground font-medium">Total Claimed</span>
                <span class="text-lg text-foreground">{formatPeso(total())}</span>
              </div>
              <div class="mt-6 space-y-3">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  class="w-full px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? "Submitting..." : "Submit Claim"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/reimbursements")}
                  class="w-full px-4 py-2.5 bg-surface text-foreground border border-border text-sm font-medium rounded-lg hover:bg-surface-muted"
                >
                  Cancel
                </button>
              </div>
              <p class="text-xs text-muted mt-4">
                <Icons.info class="w-3 h-3 inline mr-1" />
                Submitted claims go to Finance for verification, then Management for approval.
              </p>
            </div>
          </div>
        </div>
      </form>
    </PageContainer>
  )
}

function Field(props: {
  label: string
  required?: boolean
  error?: string
  children: JSX.Element
}) {
  return (
    <div>
      <span class="block text-sm font-medium text-foreground mb-1">
        {props.label}
        <Show when={props.required}>
          <span class="text-red-500 ml-0.5">*</span>
        </Show>
      </span>
      {props.children}
      <Show when={props.error}>
        <p class="text-xs text-red-600 mt-1">{props.error}</p>
      </Show>
    </div>
  )
}

function inputCls(error?: string) {
  return `w-full px-3 py-2 border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${error ? "border-red-300" : "border-border"}`
}

function DocCheckbox(props: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <label class="flex items-start gap-2 text-sm text-foreground cursor-pointer">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={props.onToggle}
        class="mt-0.5 accent-primary"
      />
      <span>{props.label}</span>
    </label>
  )
}
