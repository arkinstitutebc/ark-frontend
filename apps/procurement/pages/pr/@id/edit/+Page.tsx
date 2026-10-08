import {
  AttachmentUploader,
  BackLink,
  formatPeso,
  Icons,
  PageContainer,
  Select,
  toast,
} from "@ark/ui"
import { ApiError, api } from "@data/api"
import { useExpenseItems, useRequest, useUpdatePr } from "@data/hooks"
import { queryKeys } from "@data/query-keys"
import { createPrSchema } from "@data/schemas"
import type { Batch, PrAttachment } from "@data/types"
import { createQuery } from "@tanstack/solid-query"
import { createEffect, createMemo, createSignal, Index, Show } from "solid-js"
import { navigate } from "vike/client/router"
import { usePageContext } from "vike-solid/usePageContext"
import { QueryBoundary } from "@/components/ui"

interface PrItemInput {
  id: string
  name: string
  specification?: string
  quantity: number
  unit: string
  unitPrice: number
  remarks?: string
}

const units = ["pcs", "units", "sets", "pairs", "boxes", "kg", "liters", "hours", "days", "months"]

export default function EditPrPage() {
  const pageContext = usePageContext()
  const id = createMemo(() => pageContext.routeParams.id as string)
  const prQuery = useRequest(id)

  const batchesQuery = createQuery(() => ({
    queryKey: queryKeys.batches.all,
    queryFn: () => api<Batch[]>("/api/training/batches"),
  }))
  const expenseItemsQuery = useExpenseItems()
  const updatePrMutation = useUpdatePr()

  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [selectedBatchId, setSelectedBatchId] = createSignal("")
  const [expenseType, setExpenseType] = createSignal<"operations" | "assets">("operations")
  const [operationsSubtype, setOperationsSubtype] = createSignal<
    "training_expense" | "company_overhead"
  >("training_expense")
  const [expenseItemId, setExpenseItemId] = createSignal("")
  const [specialRequestNote, setSpecialRequestNote] = createSignal("")
  const [purpose, setPurpose] = createSignal("")
  const [dateNeeded, setDateNeeded] = createSignal("")
  const [legacyClassification, setLegacyClassification] = createSignal(false)
  const [items, setItems] = createSignal<PrItemInput[]>([])
  const [attachments, setAttachments] = createSignal<PrAttachment[]>([])
  const [hydrated, setHydrated] = createSignal(false)

  createEffect(() => {
    const pr = prQuery.data
    if (!pr || hydrated()) return
    if (pr.status !== "pending") {
      toast.error(`Cannot edit a ${pr.status} purchase request`)
      navigate(`/pr/${pr.id}`)
      return
    }
    setSelectedBatchId(pr.batchId ?? "")
    setLegacyClassification(!pr.expenseType || !pr.expenseItemId)
    setExpenseType(pr.expenseType ?? "operations")
    setOperationsSubtype(pr.operationsSubtype ?? "training_expense")
    setExpenseItemId(pr.expenseItemId ?? "")
    setSpecialRequestNote(pr.specialRequestNote ?? "")
    setPurpose(pr.purpose ?? "")
    setDateNeeded(pr.dateNeeded ? pr.dateNeeded.slice(0, 10) : "")
    setItems(
      (pr.items ?? []).map((it, i) => ({
        id: String(i + 1),
        name: it.name,
        specification: it.specification,
        quantity: it.quantity,
        unit: it.unit,
        unitPrice: it.unitPrice,
        remarks: it.remarks,
      }))
    )
    setAttachments(pr.attachments ?? [])
    setHydrated(true)
  })

  const batches = createMemo(() => (batchesQuery.data || []) as Batch[])
  const selectedBatch = createMemo(() => batches().find(b => b.id === selectedBatchId()))
  const isTrainingExpense = () =>
    expenseType() === "operations" && operationsSubtype() === "training_expense"
  const selectedExpenseItem = createMemo(() =>
    (expenseItemsQuery.data ?? []).find(item => item.id === expenseItemId())
  )
  const expenseItemOptions = createMemo(() =>
    (expenseItemsQuery.data ?? [])
      .filter(item => item.expenseType === expenseType())
      .filter(item => expenseType() === "assets" || item.operationsSubtype === operationsSubtype())
      .filter(item => {
        if (!isTrainingExpense() || item.schemeIds.length === 0) return true
        const schemeId = selectedBatch()?.trainingSchemeId
        return Boolean(schemeId && item.schemeIds.includes(schemeId))
      })
      .map(item => ({ label: item.label, value: item.id }))
  )
  const budgetQuery = createQuery(() => ({
    queryKey: queryKeys.batches.budgetSummary(selectedBatchId()),
    queryFn: () =>
      api<NonNullable<Batch["budgetSummary"]>>(
        `/api/training/batches/${selectedBatchId()}/budget-summary`
      ),
    enabled: isTrainingExpense() && !!selectedBatchId(),
  }))

  const totalAmount = () =>
    items().reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0)

  const addItem = () => {
    const newId = String(Date.now())
    setItems(prev => [...prev, { id: newId, name: "", quantity: 1, unit: "pcs", unitPrice: 0 }])
  }

  const removeItem = (rowId: string) => {
    if (items().length > 1) {
      setItems(prev => prev.filter(item => item.id !== rowId))
    }
  }

  const updateItemField = (rowId: string, field: keyof PrItemInput, value: string | number) => {
    setItems(prev => prev.map(item => (item.id === rowId ? { ...item, [field]: value } : item)))
  }

  const handleSubmit = (e: Event) => {
    e.preventDefault()

    const requestItems = items().map(item => ({
      name: item.name.trim(),
      specification: item.specification?.trim() || undefined,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      remarks: item.remarks?.trim() || undefined,
    }))

    const original = prQuery.data
    const classificationChanged = legacyClassification()
      ? Boolean(expenseItemId()) ||
        expenseType() !== "operations" ||
        operationsSubtype() !== "training_expense" ||
        selectedBatchId() !== (original?.batchId ?? "") ||
        Boolean(specialRequestNote().trim())
      : !original ||
        expenseType() !== original.expenseType ||
        (expenseType() === "operations" ? operationsSubtype() : null) !==
          original.operationsSubtype ||
        expenseItemId() !== (original.expenseItemId ?? "") ||
        (isTrainingExpense() ? selectedBatchId() : "") !== (original.batchId ?? "") ||
        specialRequestNote().trim() !== (original.specialRequestNote ?? "")

    const data = {
      batchId: isTrainingExpense() ? selectedBatchId() || undefined : undefined,
      expenseType: expenseType(),
      operationsSubtype: expenseType() === "operations" ? operationsSubtype() : undefined,
      expenseItemId: expenseItemId(),
      specialRequestNote: specialRequestNote(),
      purpose: purpose(),
      dateNeeded: dateNeeded(),
      items: requestItems,
    }

    const result = createPrSchema.safeParse(data)
    if (!result.success && (!legacyClassification() || classificationChanged)) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path.join(".") || "form"
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
        if (issue.path[0] === "items" && !fieldErrors.items)
          fieldErrors.items = "Check each item below."
      }
      setErrors(fieldErrors)
      toast.error(result.error.issues[0]?.message ?? "Check the highlighted request fields")
      return
    }
    if (selectedExpenseItem()?.requiresSpecialRequestNote && !specialRequestNote().trim()) {
      setErrors({ specialRequestNote: "Explain the special request" })
      toast.error("Explain the special request")
      return
    }
    if (legacyClassification() && !classificationChanged) {
      if (
        !purpose().trim() ||
        purpose().length > 500 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dateNeeded()) ||
        requestItems.length === 0 ||
        requestItems.some(item => !item.name || item.quantity <= 0 || item.unitPrice <= 0)
      ) {
        setErrors({ form: "Complete the request details and every item" })
        toast.error("Complete the request details and every item")
        return
      }
    }
    setErrors({})

    const prItems = requestItems.map((item, index) => ({
      id: String(index + 1),
      name: item.name,
      specification: item.specification,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
      remarks: item.remarks,
    }))

    updatePrMutation.mutate(
      {
        id: id(),
        ...(classificationChanged && {
          batchId: isTrainingExpense() ? selectedBatchId() : null,
          expenseType: expenseType(),
          operationsSubtype: expenseType() === "operations" ? operationsSubtype() : null,
          expenseItemId: expenseItemId(),
          specialRequestNote: specialRequestNote().trim() || null,
        }),
        purpose: purpose(),
        dateNeeded: dateNeeded(),
        items: prItems,
        attachments: attachments(),
        totalAmount: totalAmount().toFixed(2),
      },
      {
        onSuccess: () => {
          navigate(`/pr/${id()}`)
        },
        onError: error => {
          if (error instanceof ApiError) {
            setErrors(
              Object.fromEntries(
                Object.entries(error.details).map(([field, messages]) => [field, messages[0]])
              )
            )
          }
        },
      }
    )
  }

  const batchOptions = createMemo(() =>
    batches().map(b => ({ label: `${b.batchCode} — ${b.trainingName}`, value: b.id }))
  )
  const unitOptions = createMemo(() => units.map(u => ({ label: u, value: u })))

  return (
    <PageContainer>
      <QueryBoundary query={prQuery}>
        {() => (
          <>
            <div class="flex items-center gap-3 mb-8">
              <BackLink
                variant="icon"
                label="Back to request"
                onClick={() => navigate(`/pr/${id()}`)}
              />
              <div>
                <h1 class="text-2xl font-semibold text-foreground">Edit Purchase Request</h1>
                <p class="text-sm text-muted mt-1">
                  Editing a pending request — changes save in place.
                </p>
              </div>
            </div>

            <Show when={updatePrMutation.isError}>
              <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                Error updating request: {updatePrMutation.error?.message}
              </div>
            </Show>

            <form onSubmit={handleSubmit}>
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 space-y-6">
                  <div class="bg-surface rounded-lg border border-border p-6">
                    <h2 class="text-lg font-semibold text-foreground mb-4">Request Details</h2>

                    <div class="space-y-4">
                      <Show when={legacyClassification()}>
                        <p class="text-sm text-muted rounded-lg bg-surface-muted p-3">
                          This older request has no expense classification. You can edit its details
                          as-is, or choose an expense item to classify it.
                        </p>
                      </Show>

                      <div>
                        <span class="block text-sm font-medium text-foreground mb-1">
                          Expense Type
                        </span>
                        <Select
                          options={[
                            { label: "Operations", value: "operations" },
                            { label: "Assets", value: "assets" },
                          ]}
                          value={expenseType()}
                          onChange={value => {
                            setExpenseType(value as "operations" | "assets")
                            setExpenseItemId("")
                            setSpecialRequestNote("")
                          }}
                          ariaLabel="Expense type"
                        />
                      </div>

                      <Show when={expenseType() === "operations"}>
                        <div>
                          <span class="block text-sm font-medium text-foreground mb-1">
                            Operations Type
                          </span>
                          <Select
                            options={[
                              { label: "Training Expense", value: "training_expense" },
                              { label: "Company Overhead", value: "company_overhead" },
                            ]}
                            value={operationsSubtype()}
                            onChange={value => {
                              setOperationsSubtype(value as "training_expense" | "company_overhead")
                              setExpenseItemId("")
                              setSpecialRequestNote("")
                            }}
                            ariaLabel="Operations type"
                          />
                        </div>
                      </Show>

                      <Show when={isTrainingExpense()}>
                        <div>
                          <span class="block text-sm font-medium text-foreground mb-1">
                            Batch <span class="text-red-500">*</span>
                          </span>
                          <Select
                            options={batchOptions()}
                            value={selectedBatchId() || undefined}
                            onChange={value => {
                              setSelectedBatchId(value)
                              setExpenseItemId("")
                            }}
                            placeholder={
                              batchesQuery.isPending ? "Loading batches…" : "Select a batch"
                            }
                            disabled={batchesQuery.isPending}
                            ariaLabel="Batch"
                          />
                          <Show when={errors().batchId}>
                            <p class="text-xs text-red-600 mt-1">{errors().batchId}</p>
                          </Show>
                          <Show when={selectedBatch()}>
                            <p class="text-xs text-muted mt-1">
                              Spendable after 2% withholding:{" "}
                              {formatPeso(Number(selectedBatch()?.netBudget ?? 0))}
                            </p>
                          </Show>
                        </div>
                      </Show>

                      <div>
                        <span class="block text-sm font-medium text-foreground mb-1">
                          Expense Item
                        </span>
                        <Select
                          options={expenseItemOptions()}
                          value={expenseItemId() || undefined}
                          onChange={value => {
                            setExpenseItemId(value)
                            setSpecialRequestNote("")
                          }}
                          placeholder={
                            expenseItemsQuery.isPending
                              ? "Loading expense items…"
                              : "Select expense item"
                          }
                          disabled={expenseItemsQuery.isPending}
                          ariaLabel="Expense item"
                        />
                        <Show when={errors().expenseItemId}>
                          <p class="text-xs text-red-600 mt-1">{errors().expenseItemId}</p>
                        </Show>
                      </div>

                      <Show when={selectedExpenseItem()?.requiresSpecialRequestNote}>
                        <label class="block">
                          <span class="block text-sm font-medium text-foreground mb-1">
                            Special Request Details
                          </span>
                          <textarea
                            value={specialRequestNote()}
                            onInput={event => setSpecialRequestNote(event.currentTarget.value)}
                            rows={2}
                            required
                            maxLength={500}
                            class={`w-full px-3 py-2 border rounded-lg text-sm ${errors().specialRequestNote ? "border-red-300" : "border-border"}`}
                          />
                          <Show when={errors().specialRequestNote}>
                            <p class="mt-1 text-xs text-red-600">{errors().specialRequestNote}</p>
                          </Show>
                        </label>
                      </Show>

                      <div>
                        <label
                          for="pr-edit-date-needed"
                          class="block text-sm font-medium text-foreground mb-1"
                        >
                          Date Needed <span class="text-red-500">*</span>
                        </label>
                        <input
                          id="pr-edit-date-needed"
                          type="date"
                          value={dateNeeded()}
                          onInput={e => setDateNeeded(e.currentTarget.value)}
                          required
                          class={`w-full px-3 py-2 border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().dateNeeded ? "border-red-300" : "border-border"}`}
                        />
                        <Show when={errors().dateNeeded}>
                          <p class="text-xs text-red-600 mt-1">{errors().dateNeeded}</p>
                        </Show>
                        <p class="text-xs text-muted mt-1">
                          Ark standard: submit at least 3 working days before the required date when
                          possible.
                        </p>
                      </div>

                      <div>
                        <label
                          for="pr-edit-purpose"
                          class="block text-sm font-medium text-foreground mb-1"
                        >
                          Purpose <span class="text-red-500">*</span>
                        </label>
                        <textarea
                          id="pr-edit-purpose"
                          value={purpose()}
                          onInput={e => setPurpose(e.currentTarget.value)}
                          required
                          rows={3}
                          placeholder="Describe the purpose of this purchase request..."
                          class={`w-full px-3 py-2 border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none ${errors().purpose ? "border-red-300" : "border-border"}`}
                        />
                        <Show when={errors().purpose}>
                          <p class="text-xs text-red-600 mt-1">{errors().purpose}</p>
                        </Show>
                      </div>
                    </div>
                  </div>

                  <div class="bg-surface rounded-lg border border-border p-6">
                    <div class="flex items-center justify-between mb-4">
                      <h2 class="text-lg font-semibold text-foreground">Items</h2>
                      <Show when={errors().items}>
                        <p class="text-xs text-red-600">{errors().items}</p>
                      </Show>
                      <button
                        type="button"
                        onClick={addItem}
                        class="px-3 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                      >
                        + Add Item
                      </button>
                    </div>

                    <div class="space-y-4">
                      <Index each={items()}>
                        {(item, index) => (
                          <div class="border border-border rounded-lg p-4 space-y-3">
                            <div class="flex items-center justify-between">
                              <span class="text-sm font-medium text-foreground">
                                Item {index + 1}
                              </span>
                              <Show when={items().length > 1}>
                                <button
                                  type="button"
                                  onClick={() => removeItem(item().id)}
                                  class="text-red-500 hover:text-red-700 text-sm"
                                >
                                  <Icons.trash class="w-4 h-4" />
                                </button>
                              </Show>
                            </div>

                            <div>
                              <input
                                type="text"
                                value={item().name}
                                onInput={e =>
                                  updateItemField(item().id, "name", e.currentTarget.value)
                                }
                                placeholder="Item name/description"
                                class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              />
                            </div>

                            <div>
                              <input
                                type="text"
                                value={item().specification ?? ""}
                                onInput={e =>
                                  updateItemField(item().id, "specification", e.currentTarget.value)
                                }
                                placeholder="Specification / Details (optional)"
                                class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              />
                            </div>

                            <div class="grid grid-cols-3 gap-3">
                              <label class="block">
                                <span class="block text-xs text-muted mb-1">Quantity</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={item().quantity}
                                  onInput={e =>
                                    updateItemField(
                                      item().id,
                                      "quantity",
                                      Number.parseInt(e.currentTarget.value, 10) || 0
                                    )
                                  }
                                  class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                              </label>
                              <div>
                                <span class="block text-xs text-muted mb-1">Unit</span>
                                <Select
                                  options={unitOptions()}
                                  value={item().unit}
                                  onChange={v => updateItemField(item().id, "unit", v)}
                                  placeholder="Unit"
                                  ariaLabel="Unit"
                                />
                              </div>
                              <label class="block">
                                <span class="block text-xs text-muted mb-1">Unit Price (P)</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item().unitPrice || ""}
                                  onInput={e =>
                                    updateItemField(
                                      item().id,
                                      "unitPrice",
                                      Number.parseFloat(e.currentTarget.value) || 0
                                    )
                                  }
                                  class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                              </label>
                            </div>

                            <div>
                              <input
                                type="text"
                                value={item().remarks ?? ""}
                                onInput={e =>
                                  updateItemField(item().id, "remarks", e.currentTarget.value)
                                }
                                placeholder="Remarks (optional)"
                                class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              />
                            </div>

                            <Show when={item().name && item().quantity > 0 && item().unitPrice > 0}>
                              <p class="text-sm text-muted text-right">
                                Item Total: {formatPeso(item().quantity * item().unitPrice)}
                              </p>
                            </Show>
                          </div>
                        )}
                      </Index>
                    </div>
                  </div>
                </div>

                <div class="lg:col-span-1">
                  <div class="bg-surface rounded-lg border border-border p-6 sticky top-24">
                    <h2 class="text-lg font-semibold text-foreground mb-4">Summary</h2>

                    <div class="space-y-3">
                      <div class="flex justify-between text-sm">
                        <span class="text-muted">Total Items</span>
                        <span class="font-medium text-foreground">
                          {items().filter(i => i.name.trim()).length}
                        </span>
                      </div>

                      <div class="flex justify-between text-sm">
                        <span class="text-muted">Total Quantity</span>
                        <span class="font-medium text-foreground">
                          {items().reduce((sum, i) => sum + (i.quantity || 0), 0)}
                        </span>
                      </div>

                      <div class="border-t border-border pt-3">
                        <div class="flex justify-between">
                          <span class="text-foreground font-medium">Total Amount</span>
                          <span class="text-lg text-foreground">{formatPeso(totalAmount())}</span>
                        </div>
                      </div>

                      <Show when={isTrainingExpense() && selectedBatch()}>
                        <div class="border-t border-border pt-3">
                          <p class="text-xs text-muted mb-1">
                            Available batch budget (after 2% withholding)
                          </p>
                          <Show
                            when={budgetQuery.data}
                            fallback={
                              <p class="text-sm text-muted">
                                {budgetQuery.isError ? "Budget unavailable" : "Loading budget…"}
                              </p>
                            }
                          >
                            {budget => (
                              <>
                                <p class="text-sm font-medium text-foreground">
                                  {formatPeso(budget().availableAmount)} available
                                </p>
                                <p class="text-xs text-muted mt-1">
                                  {formatPeso(budget().availableAmount - totalAmount())} after this
                                  request
                                </p>
                                <Show when={totalAmount() > budget().availableAmount}>
                                  <p class="text-xs text-amber-700 mt-2">
                                    This request exceeds the available batch budget and needs
                                    additional funding.
                                  </p>
                                </Show>
                              </>
                            )}
                          </Show>
                        </div>
                      </Show>
                    </div>

                    <div class="mt-6 space-y-3">
                      <button
                        type="submit"
                        disabled={updatePrMutation.isPending}
                        class="w-full px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatePrMutation.isPending ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/pr/${id()}`)}
                        class="w-full px-4 py-2.5 bg-surface text-foreground border border-border text-sm font-medium rounded-lg hover:bg-surface-muted transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-6 bg-surface rounded-lg border border-border p-6">
                <h2 class="text-lg font-semibold text-foreground mb-2">Attachments</h2>
                <p class="text-xs text-muted mb-3">
                  Optional — attach receipts, supplier quotes, or invoices to support this request.
                </p>
                <AttachmentUploader
                  attachments={attachments()}
                  onChange={setAttachments}
                  signatureEndpoint="/api/procurement/upload-signature/attachment"
                />
              </div>
            </form>
          </>
        )}
      </QueryBoundary>
    </PageContainer>
  )
}
