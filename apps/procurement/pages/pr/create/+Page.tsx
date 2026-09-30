import { AttachmentUploader, BackLink, formatPeso, Icons, PageContainer, Select } from "@ark/ui"
import { ApiError, api } from "@data/api"
import { useCreatePr, useExpenseItems } from "@data/hooks"
import { queryKeys } from "@data/query-keys"
import { createPrSchema } from "@data/schemas"
import type { Batch, PrAttachment } from "@data/types"
import { createQuery } from "@tanstack/solid-query"
import { createMemo, createSignal, Index, Show } from "solid-js"
import { navigate } from "vike/client/router"

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

export default function CreatePrPage() {
  const batchesQuery = createQuery(() => ({
    queryKey: queryKeys.batches.all,
    queryFn: () => api<Batch[]>("/api/training/batches"),
  }))
  const expenseItemsQuery = useExpenseItems()
  const createPrMutation = useCreatePr()

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
  const [items, setItems] = createSignal<PrItemInput[]>([
    { id: "1", name: "", quantity: 1, unit: "pcs", unitPrice: 0 },
  ])
  const [attachments, setAttachments] = createSignal<PrAttachment[]>([])

  const budgetQuery = createQuery(() => ({
    queryKey: queryKeys.batches.budgetSummary(selectedBatchId()),
    queryFn: () =>
      api<NonNullable<Batch["budgetSummary"]>>(
        `/api/training/batches/${selectedBatchId()}/budget-summary`
      ),
    enabled:
      expenseType() === "operations" &&
      operationsSubtype() === "training_expense" &&
      !!selectedBatchId(),
  }))

  const batches = createMemo(() => {
    return (batchesQuery.data || []) as Batch[]
  })

  const selectedBatch = createMemo(() => batches().find(b => b.id === selectedBatchId()))
  const isTrainingExpense = () =>
    expenseType() === "operations" && operationsSubtype() === "training_expense"

  const totalAmount = () => {
    return items().reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0)
  }

  const addItem = () => {
    const newId = String(Date.now())
    setItems(prev => [...prev, { id: newId, name: "", quantity: 1, unit: "pcs", unitPrice: 0 }])
  }

  const removeItem = (id: string) => {
    if (items().length > 1) {
      setItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof PrItemInput, value: string | number) => {
    setItems(prev => prev.map(item => (item.id === id ? { ...item, [field]: value } : item)))
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
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path.join(".") || "form"
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
        if (issue.path[0] === "items" && !fieldErrors.items)
          fieldErrors.items = "Check each item below."
      }
      setErrors(fieldErrors)
      return
    }
    if (selectedExpenseItem()?.requiresSpecialRequestNote && !specialRequestNote().trim()) {
      setErrors({ specialRequestNote: "Explain the special request" })
      return
    }
    setErrors({})

    const batch = isTrainingExpense() ? selectedBatch() : undefined

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

    createPrMutation.mutate(
      {
        batchId: result.data.batchId,
        batchName: batch?.trainingName,
        batchCode: batch?.batchCode,
        expenseType: result.data.expenseType,
        operationsSubtype: result.data.operationsSubtype,
        expenseItemId: result.data.expenseItemId,
        specialRequestNote: result.data.specialRequestNote || undefined,
        purpose: result.data.purpose,
        dateNeeded: result.data.dateNeeded,
        items: prItems,
        attachments: attachments().length > 0 ? attachments() : undefined,
        totalAmount: totalAmount().toFixed(2),
      },
      {
        onSuccess: () => {
          navigate("/")
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
    batches().map(b => ({
      label: `${b.batchCode} — ${b.trainingName}`,
      value: b.id,
    }))
  )

  const expenseItemOptions = createMemo(() =>
    (expenseItemsQuery.data ?? [])
      .filter(item => item.expenseType === expenseType())
      .filter(item => expenseType() === "assets" || item.operationsSubtype === operationsSubtype())
      .filter(item => {
        if (operationsSubtype() !== "training_expense" || item.schemeIds.length === 0) return true
        const schemeId = selectedBatch()?.trainingSchemeId
        return Boolean(schemeId && item.schemeIds.includes(schemeId))
      })
      .map(item => ({ label: item.label, value: item.id }))
  )
  const selectedExpenseItem = createMemo(() =>
    (expenseItemsQuery.data ?? []).find(item => item.id === expenseItemId())
  )
  const unitOptions = createMemo(() => units.map(u => ({ label: u, value: u })))

  return (
    <PageContainer>
      {/* Header */}
      <div class="flex items-center gap-3 mb-8">
        <BackLink variant="icon" label="Back to Requests" onClick={() => navigate("/")} />
        <div>
          <h1 class="text-2xl font-semibold text-foreground">Create Purchase Request</h1>
          <p class="text-sm text-muted mt-1">Submit a new procurement request for approval</p>
        </div>
      </div>

      <Show when={createPrMutation.isError}>
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Error submitting request: {createPrMutation.error?.message}
        </div>
      </Show>

      <Show when={errors().form}>
        <p class="mb-6 text-sm text-red-700">{errors().form}</p>
      </Show>

      <form onSubmit={handleSubmit}>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div class="lg:col-span-2 space-y-6">
            {/* Expense hierarchy */}
            <div class="bg-surface rounded-lg border border-border p-6">
              <h2 class="text-lg font-semibold text-foreground mb-4">Request Details</h2>

              <div class="space-y-4">
                <div>
                  <span class="block text-sm font-medium text-foreground mb-1">Expense Type</span>
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

                <Show
                  when={
                    expenseType() === "operations" && operationsSubtype() === "training_expense"
                  }
                >
                  <div>
                    <span class="block text-sm font-medium text-foreground mb-1">
                      Batch <span class="text-red-500">*</span>
                    </span>
                    <Select
                      options={batchOptions()}
                      value={selectedBatchId() || undefined}
                      onChange={v => {
                        setSelectedBatchId(v)
                        setExpenseItemId("")
                      }}
                      placeholder={batchesQuery.isPending ? "Loading batches…" : "Select a batch"}
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
                  <span class="block text-sm font-medium text-foreground mb-1">Expense Item</span>
                  <Select
                    options={expenseItemOptions()}
                    value={expenseItemId() || undefined}
                    onChange={value => {
                      setExpenseItemId(value)
                      setSpecialRequestNote("")
                    }}
                    placeholder={
                      expenseItemsQuery.isPending ? "Loading expense items…" : "Select expense item"
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
                    for="pr-date-needed"
                    class="block text-sm font-medium text-foreground mb-1"
                  >
                    Date Needed <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="pr-date-needed"
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
                  <label for="pr-purpose" class="block text-sm font-medium text-foreground mb-1">
                    Purpose <span class="text-red-500">*</span>
                  </label>
                  <textarea
                    id="pr-purpose"
                    value={purpose()}
                    onInput={e => setPurpose(e.currentTarget.value)}
                    required
                    maxLength={500}
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

            {/* Items */}
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
                        <span class="text-sm font-medium text-foreground">Item {index + 1}</span>
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
                          onInput={e => updateItem(item().id, "name", e.currentTarget.value)}
                          placeholder="Item name/description"
                          class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <Show when={errors()[`items.${index}.name`]}>
                          <p class="mt-1 text-xs text-red-600">{errors()[`items.${index}.name`]}</p>
                        </Show>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={item().specification ?? ""}
                          onInput={e =>
                            updateItem(item().id, "specification", e.currentTarget.value)
                          }
                          placeholder="Specification / Details (optional)"
                          class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>

                      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <label class="block">
                          <span class="block text-xs text-muted mb-1">Quantity</span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item().quantity}
                            onInput={e =>
                              updateItem(
                                item().id,
                                "quantity",
                                Number.parseInt(e.currentTarget.value, 10) || 0
                              )
                            }
                            class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                          <Show when={errors()[`items.${index}.quantity`]}>
                            <p class="mt-1 text-xs text-red-600">
                              {errors()[`items.${index}.quantity`]}
                            </p>
                          </Show>
                        </label>
                        <div>
                          <span class="block text-xs text-muted mb-1">Unit</span>
                          <Select
                            options={unitOptions()}
                            value={item().unit}
                            onChange={v => updateItem(item().id, "unit", v)}
                            placeholder="Unit"
                            ariaLabel="Unit"
                          />
                        </div>
                        <label class="block">
                          <span class="block text-xs text-muted mb-1">Unit Price (P)</span>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item().unitPrice || ""}
                            onInput={e =>
                              updateItem(
                                item().id,
                                "unitPrice",
                                Number.parseFloat(e.currentTarget.value) || 0
                              )
                            }
                            class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                          <Show when={errors()[`items.${index}.unitPrice`]}>
                            <p class="mt-1 text-xs text-red-600">
                              {errors()[`items.${index}.unitPrice`]}
                            </p>
                          </Show>
                        </label>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={item().remarks ?? ""}
                          onInput={e => updateItem(item().id, "remarks", e.currentTarget.value)}
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

          {/* Summary Sidebar */}
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
                              This request exceeds the available batch budget. It can still be
                              submitted for approval, but needs additional funding.
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
                  disabled={createPrMutation.isPending}
                  class="w-full px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createPrMutation.isPending ? "Submitting..." : "Submit Request"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  class="w-full px-4 py-2.5 bg-surface text-foreground border border-border text-sm font-medium rounded-lg hover:bg-surface-muted transition-colors"
                >
                  Cancel
                </button>
              </div>

              <div class="mt-4 pt-4 border-t border-border">
                <p class="text-xs text-muted">
                  <Icons.info class="w-3 h-3 inline mr-1" />
                  Submitted requests will be sent to the Director for approval.
                </p>
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
    </PageContainer>
  )
}
