import type {
  AccountingTreatment,
  CostType,
  ExpenseCategory,
  PrAttachment,
  RrItem,
  RrSupportingDocs,
} from "@ark/data-types"
import {
  AttachmentUploader,
  BackLink,
  DateInput,
  formatPeso,
  Icons,
  Input,
  PageContainer,
  Select,
  Textarea,
  toast,
} from "@ark/ui"
import { useProfitCenters, useReimbursement, useUpdateRr } from "@data/hooks"
import {
  accountingTreatmentOptions,
  costTypeOptions,
  createRrSchema,
  expenseCategoryOptions,
  profitCenterOptions,
} from "@data/schemas"
import { validateForm } from "@data/validate"
import { createEffect, createMemo, createSignal, Index, Show } from "solid-js"
import { navigate } from "vike/client/router"
import { usePageContext } from "vike-solid/usePageContext"

interface ItemRow extends RrItem {
  id: string
}

const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  "cost-of-services": "Cost of Services",
  "admin-expense": "Admin Expense",
  "fixed-asset": "Fixed Asset",
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

export default function EditRrPage() {
  const ctx = usePageContext()
  const id = createMemo(() => ctx.routeParams.id as string)
  const rrQuery = useReimbursement(id)
  const profitCentersQuery = useProfitCenters(() => ({ includeInactive: false }))
  const updateMutation = useUpdateRr()

  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [claimantName, setClaimantName] = createSignal("")
  const [claimantPosition, setClaimantPosition] = createSignal("")
  const [claimantDepartment, setClaimantDepartment] = createSignal("")
  const [activity, setActivity] = createSignal("")
  const [schoolPartner, setSchoolPartner] = createSignal("")
  const [dateFiled, setDateFiled] = createSignal("")
  const [periodStart, setPeriodStart] = createSignal("")
  const [periodEnd, setPeriodEnd] = createSignal("")
  const [referencedPrCode, setReferencedPrCode] = createSignal("")
  const [expenseCategory, setExpenseCategory] = createSignal<ExpenseCategory | "">("")
  const [profitCenter, setProfitCenter] = createSignal("")
  const [accountingTreatment, setAccountingTreatment] = createSignal<AccountingTreatment | "">("")
  const [costType, setCostType] = createSignal<CostType | "">("")
  const [items, setItems] = createSignal<ItemRow[]>([])
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
  const [hydrated, setHydrated] = createSignal(false)

  createEffect(() => {
    const rr = rrQuery.data
    if (!rr || hydrated()) return
    if (rr.status !== "pending") {
      toast.error(`Cannot edit a ${rr.status} claim`)
      void navigate(`/reimbursements/${rr.id}`)
      return
    }
    setClaimantName(rr.claimantName ?? "")
    setClaimantPosition(rr.claimantPosition ?? "")
    setClaimantDepartment(rr.claimantDepartment ?? "")
    setActivity(rr.activity ?? "")
    setSchoolPartner(rr.schoolPartner ?? "")
    setDateFiled(rr.dateFiled ? rr.dateFiled.slice(0, 10) : "")
    setPeriodStart(rr.periodStart ? rr.periodStart.slice(0, 10) : "")
    setPeriodEnd(rr.periodEnd ? rr.periodEnd.slice(0, 10) : "")
    setReferencedPrCode(rr.referencedPrCode ?? "")
    setExpenseCategory((rr.expenseCategory ?? "") as ExpenseCategory | "")
    setProfitCenter(rr.profitCenter ?? "")
    setAccountingTreatment((rr.accountingTreatment ?? "") as AccountingTreatment | "")
    setCostType((rr.costType ?? "") as CostType | "")
    setItems(
      (rr.items ?? []).map((it, i) => ({
        id: String(i + 1),
        date: it.date,
        description: it.description,
        receiptNo: it.receiptNo,
        amount: it.amount,
        hasReceipt: it.hasReceipt,
      }))
    )
    setAmountInWords(rr.amountInWords ?? "")
    setAttachments(rr.attachments ?? [])
    if (rr.supportingDocs) {
      setSupportingDocs({
        receipts: !!rr.supportingDocs.receipts,
        deliveryReceipt: !!rr.supportingDocs.deliveryReceipt,
        quotation: !!rr.supportingDocs.quotation,
        prRef: !!rr.supportingDocs.prRef,
        activity: !!rr.supportingDocs.activity,
        other: rr.supportingDocs.other ?? "",
        noReceiptsExplanation: rr.supportingDocs.noReceiptsExplanation ?? "",
      })
    }
    setHydrated(true)
  })

  const toggleDoc = (key: keyof RrSupportingDocs) =>
    setSupportingDocs(prev => ({ ...prev, [key]: !prev[key] }))

  const total = createMemo(() =>
    items().reduce((sum, it) => sum + (Number.isFinite(it.amount) ? it.amount : 0), 0)
  )

  const profitCenterSelectOptions = createMemo(() => {
    const liveCenters = (profitCentersQuery.data ?? [])
      .filter(center => center.active)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))

    if (liveCenters.length > 0) {
      return liveCenters.map(center => ({ label: center.label, value: center.code }))
    }

    return profitCenterOptions.map(v => ({
      label: v === "Admin" ? "Admin / Shared" : v,
      value: v,
    }))
  })

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
  const removeItem = (rowId: string) =>
    setItems(prev => (prev.length > 1 ? prev.filter(it => it.id !== rowId) : prev))
  const updateItem = <K extends keyof ItemRow>(rowId: string, key: K, value: ItemRow[K]) =>
    setItems(prev => prev.map(it => (it.id === rowId ? { ...it, [key]: value } : it)))

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

    updateMutation.mutate(
      {
        id: id(),
        ...data,
        expenseCategory: data.expenseCategory as ExpenseCategory,
        profitCenter: data.profitCenter,
        accountingTreatment: data.accountingTreatment as AccountingTreatment,
        costType: data.costType as CostType,
        totalAmount: String(total()),
        attachments: attachments(),
        supportingDocs: hasAnyDoc
          ? {
              ...docs,
              other: docs.other?.trim() || undefined,
              noReceiptsExplanation: docs.noReceiptsExplanation?.trim() || undefined,
            }
          : undefined,
      },
      { onSuccess: () => navigate(`/reimbursements/${id()}`) }
    )
  }

  return (
    <PageContainer>
      <Show
        when={rrQuery.data}
        fallback={<div class="animate-pulse h-64 bg-surface-muted rounded-lg" />}
      >
        <div class="flex items-center gap-3 mb-8">
          <BackLink
            variant="icon"
            label="Back to claim"
            onClick={() => navigate(`/reimbursements/${id()}`)}
          />
          <div>
            <h1 class="text-2xl font-semibold text-foreground">Edit Reimbursement Claim</h1>
            <p class="text-sm text-muted mt-1">Editing a pending claim — changes save in place.</p>
          </div>
        </div>

        <Show when={updateMutation.isError}>
          <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            Error: {updateMutation.error?.message}
          </div>
        </Show>

        <form onSubmit={handleSubmit}>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
              <div class="bg-surface rounded-lg border border-border p-6">
                <h2 class="text-lg font-semibold text-foreground mb-4">Claimant</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Name"
                    value={claimantName()}
                    onInput={e => setClaimantName(e.currentTarget.value)}
                    error={errors().claimantName}
                  />
                  <Input
                    label="Position / Role"
                    value={claimantPosition()}
                    onInput={e => setClaimantPosition(e.currentTarget.value)}
                    hint="Optional"
                  />
                  <Input
                    label="Department"
                    value={claimantDepartment()}
                    onInput={e => setClaimantDepartment(e.currentTarget.value)}
                    hint="Optional"
                  />
                  <DateInput
                    label="Date Filed"
                    value={dateFiled()}
                    onValueChange={setDateFiled}
                    error={errors().dateFiled}
                    showTodayButton
                  />
                </div>
              </div>

              <div class="bg-surface rounded-lg border border-border p-6">
                <h2 class="text-lg font-semibold text-foreground mb-4">Context</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Activity / Event"
                    value={activity()}
                    onInput={e => setActivity(e.currentTarget.value)}
                    hint="Optional"
                  />
                  <Input
                    label="School / Partner Covered"
                    value={schoolPartner()}
                    onInput={e => setSchoolPartner(e.currentTarget.value)}
                    hint="Optional"
                  />
                  <DateInput
                    label="Period Start"
                    value={periodStart()}
                    onValueChange={setPeriodStart}
                  />
                  <DateInput label="Period End" value={periodEnd()} onValueChange={setPeriodEnd} />
                  <Input
                    label="Referenced PR"
                    value={referencedPrCode()}
                    onInput={e => setReferencedPrCode(e.currentTarget.value)}
                    placeholder="PR-2026-NNNNN"
                    hint="Optional"
                  />
                </div>
              </div>

              <div class="bg-surface rounded-lg border border-border p-6">
                <h2 class="text-lg font-semibold text-foreground mb-1">
                  Accounting Classification
                </h2>
                <p class="text-xs text-muted mb-4">
                  Used by finance for the segmented income statement and accounting record.
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      for="edit-rr-expense-category"
                      class="block text-sm font-medium text-foreground mb-1"
                    >
                      Expense Category
                    </label>
                    <Select
                      id="edit-rr-expense-category"
                      options={expenseCategoryOptions.map(v => ({
                        label: expenseCategoryLabels[v],
                        value: v,
                      }))}
                      value={expenseCategory() || undefined}
                      onChange={v => setExpenseCategory(v as ExpenseCategory)}
                      placeholder="Select expense category"
                      ariaLabel="Expense Category"
                      error={errors().expenseCategory}
                    />
                  </div>
                  <div>
                    <label
                      for="edit-rr-profit-center"
                      class="block text-sm font-medium text-foreground mb-1"
                    >
                      Profit Center
                    </label>
                    <Select
                      id="edit-rr-profit-center"
                      options={profitCenterSelectOptions()}
                      value={profitCenter() || undefined}
                      onChange={v => setProfitCenter(v)}
                      placeholder="Select profit center"
                      ariaLabel="Profit Center"
                      error={errors().profitCenter}
                    />
                  </div>
                  <div>
                    <label
                      for="edit-rr-accounting-treatment"
                      class="block text-sm font-medium text-foreground mb-1"
                    >
                      Accounting Treatment
                    </label>
                    <Select
                      id="edit-rr-accounting-treatment"
                      options={accountingTreatmentOptions.map(v => ({
                        label: accountingTreatmentLabels[v],
                        value: v,
                      }))}
                      value={accountingTreatment() || undefined}
                      onChange={v => setAccountingTreatment(v as AccountingTreatment)}
                      placeholder="Select treatment"
                      ariaLabel="Accounting Treatment"
                      error={errors().accountingTreatment}
                    />
                  </div>
                  <div>
                    <label
                      for="edit-rr-cost-type"
                      class="block text-sm font-medium text-foreground mb-1"
                    >
                      Cost Type
                    </label>
                    <Select
                      id="edit-rr-cost-type"
                      options={costTypeOptions.map(v => ({ label: costTypeLabels[v], value: v }))}
                      value={costType() || undefined}
                      onChange={v => setCostType(v as CostType)}
                      placeholder="Select cost type"
                      ariaLabel="Cost Type"
                      error={errors().costType}
                    />
                  </div>
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
                          <div class="sm:col-span-1">
                            <DateInput
                              label="Date"
                              value={item().date ?? ""}
                              onValueChange={value => updateItem(item().id, "date", value)}
                            />
                          </div>
                          <div class="sm:col-span-2">
                            <Input
                              label="Description"
                              value={item().description}
                              onInput={e =>
                                updateItem(item().id, "description", e.currentTarget.value)
                              }
                            />
                          </div>
                          <div class="sm:col-span-1">
                            <Input
                              label="Receipt #"
                              value={item().receiptNo ?? ""}
                              onInput={e =>
                                updateItem(item().id, "receiptNo", e.currentTarget.value)
                              }
                              hint="Optional"
                            />
                          </div>
                          <div class="sm:col-span-1">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              label="Amount (PHP)"
                              value={item().amount || ""}
                              onInput={e =>
                                updateItem(
                                  item().id,
                                  "amount",
                                  Number.parseFloat(e.currentTarget.value) || 0
                                )
                              }
                            />
                          </div>
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
                  <Input
                    id="amount-words-edit"
                    label="Amount in words"
                    value={amountInWords()}
                    onInput={e => setAmountInWords(e.currentTarget.value)}
                    hint="Optional"
                  />
                </div>
              </div>

              <div class="bg-surface rounded-lg border border-border p-6">
                <h2 class="text-lg font-semibold text-foreground mb-1">Supporting Documents</h2>
                <p class="text-xs text-muted mb-4">
                  Tick what's attached. Claims should be filed within 5 working days; official
                  receipts are expected for amounts PHP 300 and above.
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
                  <Input
                    label="Other"
                    value={supportingDocs().other ?? ""}
                    onInput={e => setSupportingDocs(p => ({ ...p, other: e.currentTarget.value }))}
                    hint="Optional"
                  />
                  <Textarea
                    label="No receipts available explanation"
                    rows={2}
                    value={supportingDocs().noReceiptsExplanation ?? ""}
                    onInput={e =>
                      setSupportingDocs(p => ({
                        ...p,
                        noReceiptsExplanation: e.currentTarget.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div class="bg-surface rounded-lg border border-border p-6">
                <h2 class="text-lg font-semibold text-foreground mb-1">Attachments</h2>
                <p class="text-xs text-muted mb-3">
                  Optional — upload receipt photos, supplier quotes, or invoices.
                </p>
                <AttachmentUploader
                  attachments={attachments()}
                  onChange={setAttachments}
                  signatureEndpoint="/api/reimbursements/upload-signature/attachment"
                />
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
                    disabled={updateMutation.isPending}
                    class="w-full px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/reimbursements/${id()}`)}
                    class="w-full px-4 py-2.5 bg-surface text-foreground border border-border text-sm font-medium rounded-lg hover:bg-surface-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Show>
    </PageContainer>
  )
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
