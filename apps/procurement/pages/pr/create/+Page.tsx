import { api } from "@data/api"
import { useCreatePr } from "@data/hooks"
import { queryKeys } from "@data/query-keys"
import { createPrSchema } from "@data/schemas"
import type { Batch } from "@data/types"
import { validateForm } from "@data/validate"
import { createQuery } from "@tanstack/solid-query"
import { createMemo, createSignal, For, Index, Show } from "solid-js"
import { Icons } from "@/components/ui/icons"

const categories = [
  "Training Supplies",
  "Equipment",
  "Trainer Fees",
  "Facility",
  "Transportation",
  "Meals & Allowances",
  "Office Supplies",
  "Other",
]

interface PrItemInput {
  id: string
  name: string
  quantity: number
  unit: string
  unitPrice: number
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount)
}

const units = ["pcs", "units", "sets", "pairs", "boxes", "kg", "liters", "hours", "days", "months"]

export default function CreatePrPage() {
  const batchesQuery = createQuery(() => ({
    queryKey: queryKeys.batches.all,
    queryFn: () => api<Batch[]>("/api/training/batches"),
  }))
  const createPrMutation = useCreatePr()

  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [selectedBatchId, setSelectedBatchId] = createSignal("")
  const [category, setCategory] = createSignal("")
  const [purpose, setPurpose] = createSignal("")
  const [items, setItems] = createSignal<PrItemInput[]>([
    { id: "1", name: "", quantity: 1, unit: "pcs", unitPrice: 0 },
  ])

  const batches = createMemo(() => {
    return (batchesQuery.data || []) as Batch[]
  })

  const selectedBatch = createMemo(() => batches().find(b => b.id === selectedBatchId()))

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

    const validItems = items()
      .filter(item => item.name.trim() && item.quantity > 0 && item.unitPrice > 0)
      .map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
      }))

    const data = {
      batchId: selectedBatchId(),
      category: category(),
      purpose: purpose(),
      items:
        validItems.length > 0
          ? validItems
          : items().map(item => ({
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
            })),
    }

    const result = validateForm(createPrSchema, data)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    const batch = selectedBatch()

    const prItems = validItems.map((item, index) => ({
      id: String(index + 1),
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }))

    createPrMutation.mutate(
      {
        prCode: `PR-${Date.now()}`,
        batchId: selectedBatchId(),
        batchName: batch?.trainingName || "",
        batchCode: batch?.batchCode || "",
        category: category(),
        purpose: purpose(),
        items: prItems,
        totalAmount: String(totalAmount()),
      },
      {
        onSuccess: () => {
          window.location.href = "/"
        },
      }
    )
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div class="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => (window.location.href = "/")}
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Icons.arrowLeft class="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Create Purchase Request</h1>
          <p class="text-sm text-gray-500 mt-1">Submit a new procurement request for approval</p>
        </div>
      </div>

      <Show when={createPrMutation.isError}>
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Error submitting request: {createPrMutation.error?.message}
        </div>
      </Show>

      <form onSubmit={handleSubmit}>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div class="lg:col-span-2 space-y-6">
            {/* Batch & Category */}
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Request Details</h2>

              <div class="space-y-4">
                <div>
                  <label for="pr-batch" class="block text-sm font-medium text-gray-700 mb-1">
                    Batch <span class="text-red-500">*</span>
                  </label>
                  <select
                    id="pr-batch"
                    value={selectedBatchId()}
                    onInput={e => setSelectedBatchId(e.currentTarget.value)}
                    required
                    disabled={batchesQuery.isPending}
                    class={`w-full px-3 py-2 border rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50 disabled:cursor-not-allowed ${errors().batchId ? "border-red-300" : "border-gray-200"}`}
                  >
                    <option value="">
                      {batchesQuery.isPending ? "Loading batches..." : "Select a batch"}
                    </option>
                    <For each={batches()}>
                      {batch => (
                        <option value={batch.id}>
                          {batch.batchCode} - {batch.trainingName}
                        </option>
                      )}
                    </For>
                  </select>
                  <Show when={errors().batchId}>
                    <p class="text-xs text-red-600 mt-1">{errors().batchId}</p>
                  </Show>
                  <Show when={selectedBatch()}>
                    <p class="text-xs text-gray-500 mt-1">
                      Budget: {formatCurrency(selectedBatch()?.budget || 0)} | Used:{" "}
                      {formatCurrency(selectedBatch()?.budgetUsed || 0)}
                    </p>
                  </Show>
                </div>

                <div>
                  <label for="pr-category" class="block text-sm font-medium text-gray-700 mb-1">
                    Category <span class="text-red-500">*</span>
                  </label>
                  <select
                    id="pr-category"
                    value={category()}
                    onInput={e => setCategory(e.currentTarget.value)}
                    required
                    class={`w-full px-3 py-2 border rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().category ? "border-red-300" : "border-gray-200"}`}
                  >
                    <option value="">Select category</option>
                    <For each={categories}>{cat => <option value={cat}>{cat}</option>}</For>
                  </select>
                  <Show when={errors().category}>
                    <p class="text-xs text-red-600 mt-1">{errors().category}</p>
                  </Show>
                </div>

                <div>
                  <label for="pr-purpose" class="block text-sm font-medium text-gray-700 mb-1">
                    Purpose <span class="text-red-500">*</span>
                  </label>
                  <textarea
                    id="pr-purpose"
                    value={purpose()}
                    onInput={e => setPurpose(e.currentTarget.value)}
                    required
                    rows={3}
                    placeholder="Describe the purpose of this purchase request..."
                    class={`w-full px-3 py-2 border rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none ${errors().purpose ? "border-red-300" : "border-gray-200"}`}
                  />
                  <Show when={errors().purpose}>
                    <p class="text-xs text-red-600 mt-1">{errors().purpose}</p>
                  </Show>
                </div>
              </div>
            </div>

            {/* Items */}
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-gray-900">Items</h2>
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
                    <div class="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-gray-700">Item {index + 1}</span>
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
                          class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>

                      <div class="grid grid-cols-3 gap-3">
                        <label class="block">
                          <span class="block text-xs text-gray-500 mb-1">Quantity</span>
                          <input
                            type="number"
                            min="1"
                            value={item().quantity}
                            onInput={e =>
                              updateItem(
                                item().id,
                                "quantity",
                                Number.parseInt(e.currentTarget.value, 10) || 0
                              )
                            }
                            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </label>
                        <label class="block">
                          <span class="block text-xs text-gray-500 mb-1">Unit</span>
                          <select
                            value={item().unit}
                            onInput={e => updateItem(item().id, "unit", e.currentTarget.value)}
                            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          >
                            <For each={units}>{unit => <option value={unit}>{unit}</option>}</For>
                          </select>
                        </label>
                        <label class="block">
                          <span class="block text-xs text-gray-500 mb-1">Unit Price (P)</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item().unitPrice || ""}
                            onInput={e =>
                              updateItem(
                                item().id,
                                "unitPrice",
                                Number.parseFloat(e.currentTarget.value) || 0
                              )
                            }
                            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </label>
                      </div>

                      <Show when={item().name && item().quantity > 0 && item().unitPrice > 0}>
                        <p class="text-sm text-gray-600 text-right">
                          Item Total: {formatCurrency(item().quantity * item().unitPrice)}
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
            <div class="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Summary</h2>

              <div class="space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Total Items</span>
                  <span class="font-medium text-gray-900">
                    {items().filter(i => i.name.trim()).length}
                  </span>
                </div>

                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Total Quantity</span>
                  <span class="font-medium text-gray-900">
                    {items().reduce((sum, i) => sum + (i.quantity || 0), 0)}
                  </span>
                </div>

                <div class="border-t border-gray-200 pt-3">
                  <div class="flex justify-between">
                    <span class="text-gray-900 font-medium">Total Amount</span>
                    <span class="text-lg text-gray-900">{formatCurrency(totalAmount())}</span>
                  </div>
                </div>

                <Show when={selectedBatch()}>
                  <div class="border-t border-gray-200 pt-3">
                    <p class="text-xs text-gray-500 mb-1">Budget Remaining</p>
                    <p class="text-sm font-medium text-gray-900">
                      {formatCurrency(
                        (selectedBatch()?.budget || 0) -
                          (selectedBatch()?.budgetUsed || 0) -
                          totalAmount()
                      )}
                    </p>
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
                  onClick={() => (window.location.href = "/")}
                  class="w-full px-4 py-2.5 bg-white text-gray-700 border border-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>

              <div class="mt-4 pt-4 border-t border-gray-200">
                <p class="text-xs text-gray-500">
                  <Icons.info class="w-3 h-3 inline mr-1" />
                  Submitted requests will be sent to the Director for approval.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
