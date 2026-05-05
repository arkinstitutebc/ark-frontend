import { useCreatePo, useRequests } from "@data/hooks"
import { createPoSchema } from "@data/schemas"
import type { PurchaseRequest } from "@data/types"
import { validateForm } from "@data/validate"
import { createEffect, createMemo, createSignal, For, onMount, Show } from "solid-js"
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
    return pr.items.reduce((sum, item) => sum + (item.total || 0), 0)
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
        items: pr.items,
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
          class="p-2 hover:bg-surface-muted rounded-lg transition-colors"
        >
          <Icons.arrowLeft class="w-5 h-5 text-muted" />
        </button>
        <div>
          <h1 class="text-2xl font-semibold text-foreground">Create Purchase Order</h1>
          <p class="text-sm text-muted mt-1">Generate a PO from an approved purchase request</p>
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
            <div class="bg-surface rounded-lg border border-border p-6">
              <h2 class="text-lg font-semibold text-foreground mb-4">Order Details</h2>

              <div class="space-y-4">
                <div>
                  <label for="po-pr" class="block text-sm font-medium text-foreground mb-1">
                    Purchase Request <span class="text-red-500">*</span>
                  </label>
                  <select
                    id="po-pr"
                    value={prId()}
                    onInput={handlePrChange}
                    required
                    disabled={approvedPrsQuery.isPending}
                    class={`w-full px-3 py-2 border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-surface-muted disabled:cursor-not-allowed ${errors().prId ? "border-red-300" : "border-border"}`}
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
                  <label for="po-supplier" class="block text-sm font-medium text-foreground mb-1">
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
                    class={`w-full px-3 py-2 border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-surface-muted disabled:cursor-not-allowed ${errors().supplier ? "border-red-300" : "border-border"}`}
                  />
                  <Show when={errors().supplier}>
                    <p class="text-xs text-red-600 mt-1">{errors().supplier}</p>
                  </Show>
                </div>

                <div>
                  <label for="po-delivery" class="block text-sm font-medium text-foreground mb-1">
                    Estimated Delivery
                  </label>
                  <input
                    id="po-delivery"
                    type="date"
                    value={estimatedDelivery()}
                    onInput={e => setEstimatedDelivery(e.currentTarget.value)}
                    min={new Date().toISOString().split("T")[0]}
                    class="w-full px-3 py-2 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label for="po-notes" class="block text-sm font-medium text-foreground mb-1">
                    Notes
                  </label>
                  <textarea
                    id="po-notes"
                    value={notes()}
                    onInput={e => setNotes(e.currentTarget.value)}
                    rows={2}
                    placeholder="Additional notes for supplier..."
                    class="w-full px-3 py-2 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Items from PR */}
            <Show when={selectedPr()}>
              {pr => (
                <div class="bg-surface rounded-lg border border-border p-6">
                  <h2 class="text-lg font-semibold text-foreground mb-4">Items</h2>

                  <div class="overflow-x-auto">
                    <table class="w-full">
                      <thead class="bg-surface-muted border-b border-border">
                        <tr>
                          <th class="text-left py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wider">
                            Item
                          </th>
                          <th class="text-left py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wider">
                            Qty
                          </th>
                          <th class="text-left py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wider">
                            Unit
                          </th>
                          <th class="text-right py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={pr().items}>
                          {item => (
                            <tr class="border-t border-border">
                              <td class="py-4 px-6 text-sm text-foreground">{item.name}</td>
                              <td class="py-4 px-6 text-sm text-foreground">{item.quantity}</td>
                              <td class="py-4 px-6 text-sm text-muted">{item.unit}</td>
                              <td class="py-4 px-6 text-sm text-foreground text-right">
                                {formatCurrency(item.total)}
                              </td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                      <tfoot class="border-t border-border">
                        <tr>
                          <td
                            colSpan={3}
                            class="py-4 px-6 text-right text-sm font-medium text-foreground"
                          >
                            Total
                          </td>
                          <td class="py-4 px-6 text-right text-base text-foreground">
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
            <div class="bg-surface rounded-lg border border-border p-6 sticky top-24">
              <h2 class="text-lg font-semibold text-foreground mb-4">Summary</h2>

              <Show when={selectedPr()}>
                {pr => (
                  <div class="space-y-3">
                    <div class="flex justify-between text-sm">
                      <span class="text-muted">PR Reference</span>
                      <span class="font-mono text-foreground">{pr().prCode}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-muted">Batch</span>
                      <span class="text-foreground">{pr().batchName}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-muted">Category</span>
                      <span class="text-foreground">{pr().category}</span>
                    </div>
                    <div class="border-t border-border pt-3">
                      <div class="flex justify-between">
                        <span class="text-foreground font-medium">Total Amount</span>
                        <span class="text-lg text-foreground">{formatCurrency(totalAmount())}</span>
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
                  class="w-full px-4 py-2.5 bg-surface text-foreground border border-border text-sm font-medium rounded-lg hover:bg-surface-muted transition-colors"
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
