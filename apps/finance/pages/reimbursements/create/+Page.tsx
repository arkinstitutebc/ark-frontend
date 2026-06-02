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
  Button,
  DateInput,
  formatPeso,
  Icons,
  Input,
  PageContainer,
  Select,
  Textarea,
} from "@ark/ui"
import { useCreateRr, useCurrentUser, useProfitCenters } from "@data/hooks"
import { createRrSchema } from "@data/schemas"
import { validateForm } from "@data/validate"
import { createEffect, createMemo, createSignal, Index, Show } from "solid-js"
import { navigate } from "vike/client/router"
import {
  buildReimbursementProfitCenterOptions,
  rrAccountingTreatmentOptions,
  rrCostTypeOptions,
  rrExpenseCategoryOptions,
} from "@/components/finance/reimbursement-form-options"
import { ReimbursementValidationSummary } from "@/components/finance/reimbursement-validation-summary"

interface ItemRow extends RrItem {
  id: string
}

export default function CreateRrPage() {
  const me = useCurrentUser()
  const profitCentersQuery = useProfitCenters(() => ({ includeInactive: false }))
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
  const [profitCenter, setProfitCenter] = createSignal("")
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

  const profitCenterSelectOptions = createMemo(() =>
    buildReimbursementProfitCenterOptions(profitCentersQuery.data)
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
        profitCenter: data.profitCenter,
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
            <ReimbursementValidationSummary errors={errors()} />
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
                  placeholder="e.g. Operations Coordinator"
                  hint="Optional"
                />
                <Input
                  label="Department"
                  value={claimantDepartment()}
                  onInput={e => setClaimantDepartment(e.currentTarget.value)}
                  placeholder="e.g. Training"
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
                  placeholder="e.g. NC-II Bartending intake"
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
              <h2 class="text-lg font-semibold text-foreground mb-1">Accounting Classification</h2>
              <p class="text-xs text-muted mb-4">
                Used by finance for the segmented income statement and accounting record.
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    for="rr-expense-category"
                    class="block text-sm font-medium text-foreground mb-1"
                  >
                    Expense Category
                  </label>
                  <Select
                    id="rr-expense-category"
                    options={rrExpenseCategoryOptions}
                    value={expenseCategory() || undefined}
                    onChange={v => setExpenseCategory(v as ExpenseCategory)}
                    placeholder="Select expense category"
                    ariaLabel="Expense Category"
                    error={errors().expenseCategory}
                  />
                </div>
                <div>
                  <label
                    for="rr-profit-center"
                    class="block text-sm font-medium text-foreground mb-1"
                  >
                    Profit Center
                  </label>
                  <Select
                    id="rr-profit-center"
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
                    for="rr-accounting-treatment"
                    class="block text-sm font-medium text-foreground mb-1"
                  >
                    Accounting Treatment
                  </label>
                  <Select
                    id="rr-accounting-treatment"
                    options={rrAccountingTreatmentOptions}
                    value={accountingTreatment() || undefined}
                    onChange={v => setAccountingTreatment(v as AccountingTreatment)}
                    placeholder="Select treatment"
                    ariaLabel="Accounting Treatment"
                    error={errors().accountingTreatment}
                  />
                </div>
                <div>
                  <label for="rr-cost-type" class="block text-sm font-medium text-foreground mb-1">
                    Cost Type
                  </label>
                  <Select
                    id="rr-cost-type"
                    options={rrCostTypeOptions}
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
                <Button type="button" onClick={addItem} variant="ghost" size="sm">
                  <Icons.plus class="h-4 w-4" />
                  Add Item
                </Button>
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
                            onInput={e => updateItem(item().id, "receiptNo", e.currentTarget.value)}
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
                  id="amount-words"
                  label="Amount in words"
                  value={amountInWords()}
                  onInput={e => setAmountInWords(e.currentTarget.value)}
                  placeholder="e.g. One thousand five hundred Philippine Pesos only"
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
                  placeholder="e.g. Travel itinerary, signed waiver..."
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
                  placeholder="If receipts couldn't be obtained, describe why per Ark policy."
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
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  size="sm"
                  class="w-full"
                  loading={createMutation.isPending}
                  loadingLabel="Submitting..."
                >
                  Submit Claim
                </Button>
                <Button
                  type="button"
                  onClick={() => navigate("/reimbursements")}
                  variant="secondary"
                  size="sm"
                  class="w-full"
                >
                  Cancel
                </Button>
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
