import { api } from "@data/api"
import { useCreateAr } from "@data/hooks"
import { queryKeys } from "@data/query-keys"
import { createArSchema } from "@data/schemas"
import type { Batch } from "@data/types"
import { validateForm } from "@data/validate"
import { createQuery } from "@tanstack/solid-query"
import { createSignal, For, Show } from "solid-js"
import { Icons } from "@/components/ui"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function CreateBillingPage() {
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [selectedBatchId, setSelectedBatchId] = createSignal("")
  const [amount, setAmount] = createSignal("")
  const [notes, setNotes] = createSignal("")

  // Fetch batches from training API for the batch selector
  const batchesQuery = createQuery(() => ({
    queryKey: queryKeys.batches.all,
    queryFn: () => api<Batch[]>("/api/training/batches"),
  }))

  const mutation = useCreateAr()

  const selectedBatch = () => (batchesQuery.data || []).find(b => b.id === selectedBatchId())
  const amountValue = () => {
    const v = Number.parseFloat(amount())
    return Number.isNaN(v) ? 0 : v
  }
  const canSubmit = () => selectedBatchId() !== "" && amountValue() > 0 && !mutation.isPending

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    if (!canSubmit()) return
    const batch = selectedBatch()
    if (!batch) return

    const data = {
      batchId: selectedBatchId(),
      amount: amountValue(),
      notes: notes() || undefined,
    }

    const result = validateForm(createArSchema, data)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    mutation.mutate(
      {
        batchId: batch.id,
        batchCode: batch.batchCode,
        amount: String(amountValue()),
        notes: notes() || undefined,
      },
      {
        onSuccess: () => {
          window.location.href = "/receivables"
        },
      }
    )
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <div class="flex items-center gap-4 mb-8">
        <a href="/receivables" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Icons.arrowLeft class="w-5 h-5 text-gray-600" />
        </a>
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Create Billing Statement</h1>
          <p class="text-sm text-gray-500 mt-1">Create an accounts receivable record for a batch</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Billing Details</h2>
              <div class="space-y-4">
                <div>
                  <label for="batch-select" class="block text-sm font-medium text-gray-700 mb-1">
                    Select Batch
                  </label>
                  <select
                    id="batch-select"
                    value={selectedBatchId()}
                    onChange={e => setSelectedBatchId(e.currentTarget.value)}
                    class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white ${errors().batchId ? "border-red-300" : "border-gray-200"}`}
                  >
                    <option value="">Choose a batch...</option>
                    <For each={batchesQuery.data || []}>
                      {(batch: Batch) => (
                        <option value={batch.id}>
                          {batch.batchCode} — {batch.trainingName}
                        </option>
                      )}
                    </For>
                  </select>
                  <Show when={errors().batchId}>
                    <p class="text-xs text-red-600 mt-1">{errors().batchId}</p>
                  </Show>
                </div>

                <Show when={selectedBatch()}>
                  {batch => (
                    <div class="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div class="flex items-start gap-3">
                        <Icons.info class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div class="space-y-2 text-sm flex-1">
                          <p class="font-medium text-blue-900">{batch().trainingName}</p>
                          <div class="grid grid-cols-2 gap-2">
                            <div>
                              <span class="text-blue-700">Students:</span>{" "}
                              <span class="text-blue-900 font-medium">
                                {batch().studentsEnrolled} / {batch().studentsCapacity}
                              </span>
                            </div>
                            <div>
                              <span class="text-blue-700">Senator:</span>{" "}
                              <span class="text-blue-900 font-medium">{batch().senator}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Show>

                <div>
                  <label for="billing-amount" class="block text-sm font-medium text-gray-700 mb-1">
                    Billing Amount (PHP)
                  </label>
                  <input
                    id="billing-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount()}
                    onInput={e => setAmount(e.currentTarget.value)}
                    placeholder="0.00"
                    class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().amount ? "border-red-300" : "border-gray-200"}`}
                  />
                  <Show when={errors().amount}>
                    <p class="text-xs text-red-600 mt-1">{errors().amount}</p>
                  </Show>
                  <div class="flex items-center gap-2 mt-2">
                    {[1000000, 2000000, 3000000, 5000000].map(v => (
                      <button
                        type="button"
                        onClick={() => setAmount(String(v))}
                        class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      >
                        {formatCurrency(v)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label for="billing-notes" class="block text-sm font-medium text-gray-700 mb-1">
                    Notes <span class="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    id="billing-notes"
                    value={notes()}
                    onInput={e => setNotes(e.currentTarget.value)}
                    placeholder="Additional notes..."
                    rows={3}
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-1">
            <div class="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Batch</span>
                  <span class="font-medium">{selectedBatch()?.batchCode || "—"}</span>
                </div>
                <div class="border-t pt-3 flex justify-between">
                  <span class="font-medium">Amount</span>
                  <span class="text-xl tabular-nums">
                    {amountValue() > 0 ? formatCurrency(amountValue()) : "—"}
                  </span>
                </div>
                <Show when={selectedBatch()}>
                  {batch => (
                    <div class="border-t pt-3 flex justify-between text-xs text-gray-500">
                      <span>Batch Budget</span>
                      <span class="tabular-nums">{formatCurrency(Number(batch().budget))}</span>
                    </div>
                  )}
                </Show>
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
                  {mutation.isPending ? "Creating..." : "Create Billing Statement"}
                </button>
                <a
                  href="/receivables"
                  class="block w-full px-4 py-2.5 bg-white text-gray-700 border border-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors text-center"
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
