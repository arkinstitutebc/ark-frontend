import { api } from "@data/api"
import { useCreatePo, useRequests } from "@data/hooks"
import { queryKeys } from "@data/query-keys"
import { createPoSchema } from "@data/schemas"
import type { PurchaseRequest } from "@data/types"
import { validateForm } from "@data/validate"
import { createQuery } from "@tanstack/solid-query"
import { createEffect, createMemo, createSignal, For, onMount, Show } from "solid-js"
import { QueryBoundary } from "@/components/ui"
import { Icons } from "@/components/ui/icons"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount)
}

export default function CreatePoPage() {
  const approvedPrsQuery = useRequests(() => ({ status: "approved" }))
  const createPoMutation = useCreatePo()

  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [prId, setPrId] = createSignal("")
  const [supplier, setSupplier] = createSignal("")
  const [estimatedDelivery, setEstimatedDelivery] = createSignal("")
  const [notes, setNotes] = createSignal("")

  // Get prId from query param on mount
  onMount(() => {
    const params = new URLSearchParams(window.location.search)
    const paramPrId = params.get("prId")
    if (paramPrId) setPrId(paramPrId)
  })

  const approvedPrs = createMemo(() => {
    return (approvedPrsQuery.data || []) as PurchaseRequest[]
  })

  const selectedPr = createMemo(() => {
    if (!prId()) return null
    const pr = approvedPrs().find(r => r.id === prId())
    return pr && pr.status === "approved" ? pr : null
  })

  const totalAmount = createMemo(() => {
    const pr = selectedPr()
    if (!pr) return 0
    return (pr.items as Array<any>).reduce((sum: number, item: any) => sum + (item.total || 0), 0)
  })

  // Set default delivery date (2 weeks from now) when PR is selected
  createEffect(() => {
    if (selectedPr() && !estimatedDelivery()) {
      const date = new Date()
      date.setDate(date.getDate() + 14)
      setEstimatedDelivery(date.toISOString().split("T")[0])
    }
  })

  const handleSubmit = (e: Event) => {
    e.preventDefault()

    const data = {
      prId: prId(),
      supplier: supplier(),
    }

    const result = validateForm(createPoSchema, data)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    const pr = selectedPr()
    if (!pr) return

    createPoMutation.mutate(
      {
        poCode: `PO-${Date.now()}`,
        prId: pr.id,
        batchId: pr.batchId,
        batchName: pr.batchName,
        supplier: supplier(),
        items: pr.items as any,
        totalAmount: String(totalAmount()),
        estimatedDelivery: estimatedDelivery() || undefined,
        notes: notes() || undefined,
      },
      {
        onSuccess: () => {
          window.location.href = "/orders"
        },
      }
    )
  }

  const handlePrChange = (e: Event) => {
    const target = e.currentTarget as HTMLSelectElement
    setPrId(target.value)
    setSupplier("")
    setNotes("")
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div class="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => (window.location.href = "/orders")}
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Icons.arrowLeft class="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Create Purchase Order</h1>
          <p class="text-sm text-gray-500 mt-1">Generate a PO from an approved purchase request</p>
        </div>
      </div>

      <Show when={createPoMutation.isError}>
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Error creating purchase order: {createPoMutation.error?.message}
        </div>
      </Show>

      <form onSubmit={handleSubmit}>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div class="lg:col-span-2 space-y-6">
            {/* PR & Supplier Selection */}
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>

              <div class="space-y-4">
                <div>
                  <label for="po-pr" class="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Request <span class="text-red-500">*</span>
                  </label>
                  <select
                    id="po-pr"
                    value={prId()}
                    onInput={handlePrChange}
                    required
                    disabled={approvedPrsQuery.isPending}
                    class={`w-full px-3 py-2 border rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50 disabled:cursor-not-allowed ${errors().prId ? "border-red-300" : "border-gray-200"}`}
                  >
                    <option value="">
                      {approvedPrsQuery.isPending
                        ? "Loading approved PRs..."
                        : "Select an approved PR"}
                    </option>
                    <For each={approvedPrs()}>
                      {pr => (
                        <option value={pr.id}>
                          {pr.prCode} - {pr.batchName} ({formatCurrency(Number(pr.totalAmount))})
                        </option>
                      )}
                    </For>
                  </select>
                  <Show when={errors().prId}>
                    <p class="text-xs text-red-600 mt-1">{errors().prId}</p>
                  </Show>
                </div>

                <div>
                  <label for="po-supplier" class="block text-sm font-medium text-gray-700 mb-1">
                    Supplier <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="po-supplier"
                    type="text"
                    value={supplier()}
                    onInput={e => setSupplier(e.currentTarget.value)}
                    required
                    disabled={!selectedPr()}
                    placeholder="Enter supplier name"
                    class={`w-full px-3 py-2 border rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50 disabled:cursor-not-allowed ${errors().supplier ? "border-red-300" : "border-gray-200"}`}
                  />
                  <Show when={errors().supplier}>
                    <p class="text-xs text-red-600 mt-1">{errors().supplier}</p>
                  </Show>
                </div>

                <div>
                  <label for="po-delivery" class="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Delivery
                  </label>
                  <input
                    id="po-delivery"
                    type="date"
                    value={estimatedDelivery()}
                    onInput={e => setEstimatedDelivery(e.currentTarget.value)}
                    min={new Date().toISOString().split("T")[0]}
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label for="po-notes" class="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    id="po-notes"
                    value={notes()}
                    onInput={e => setNotes(e.currentTarget.value)}
                    rows={2}
                    placeholder="Additional notes for supplier..."
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Items from PR */}
            <Show when={selectedPr()}>
              {pr => (
                <div class="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 class="text-lg font-semibold text-gray-900 mb-4">Items</h2>

                  <div class="overflow-x-auto">
                    <table class="w-full">
                      <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th class="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Item
                          </th>
                          <th class="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Qty
                          </th>
                          <th class="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Unit
                          </th>
                          <th class="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={pr().items as Array<any>}>
                          {item => (
                            <tr class="border-t border-gray-100">
                              <td class="py-4 px-6 text-sm text-gray-900">{item.name}</td>
                              <td class="py-4 px-6 text-sm text-gray-900">{item.quantity}</td>
                              <td class="py-4 px-6 text-sm text-gray-600">{item.unit}</td>
                              <td class="py-4 px-6 text-sm text-gray-900 text-right">
                                {formatCurrency(item.total)}
                              </td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                      <tfoot class="border-t border-gray-200">
                        <tr>
                          <td
                            colSpan={3}
                            class="py-4 px-6 text-right text-sm font-medium text-gray-900"
                          >
                            Total
                          </td>
                          <td class="py-4 px-6 text-right text-base text-gray-900">
                            {formatCurrency(totalAmount())}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </Show>
          </div>

          {/* Summary Sidebar */}
          <div class="lg:col-span-1">
            <div class="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Summary</h2>

              <Show when={selectedPr()}>
                {pr => (
                  <div class="space-y-3">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">PR Reference</span>
                      <span class="font-mono text-gray-900">{(pr() as any).prCode}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Batch</span>
                      <span class="text-gray-900">{pr().batchName}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Category</span>
                      <span class="text-gray-900">{pr().category}</span>
                    </div>
                    <div class="border-t border-gray-200 pt-3">
                      <div class="flex justify-between">
                        <span class="text-gray-900 font-medium">Total Amount</span>
                        <span class="text-lg text-gray-900">{formatCurrency(totalAmount())}</span>
                      </div>
                    </div>
                  </div>
                )}
              </Show>

              <div class="mt-6 space-y-3">
                <button
                  type="submit"
                  disabled={createPoMutation.isPending || !selectedPr() || !supplier()}
                  class="w-full px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createPoMutation.isPending ? "Creating..." : "Create Order"}
                </button>
                <button
                  type="button"
                  onClick={() => (window.location.href = "/orders")}
                  class="w-full px-4 py-2.5 bg-white text-gray-700 border border-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
