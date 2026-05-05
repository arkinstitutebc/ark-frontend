import { useReceivables, useRecordPayment, useUpdateAr } from "@data/hooks"
import type { AccountReceivable, ArStatus } from "@data/types"
import { createMemo, createSignal, For, Show } from "solid-js"
import { Icons, Modal, QueryBoundary, StatusBadge } from "@/components/ui"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

type FilterStatus = "all" | ArStatus

export default function ReceivablesPage() {
  const [filterStatus, setFilterStatus] = createSignal<FilterStatus>("all")
  const [searchQuery, setSearchQuery] = createSignal("")
  const [paymentModalOpen, setPaymentModalOpen] = createSignal(false)
  const [selectedAr, setSelectedAr] = createSignal<AccountReceivable | null>(null)
  const [paymentAmount, setPaymentAmount] = createSignal("")
  const [paymentNotes, setPaymentNotes] = createSignal("")

  const query = useReceivables()
  const updateMutation = useUpdateAr()
  const paymentMutation = useRecordPayment()

  const filteredAr = createMemo(() => {
    let items = [...(query.data || [])]
    if (filterStatus() !== "all") items = items.filter(ar => ar.status === filterStatus())
    const q = searchQuery().toLowerCase().trim()
    if (q)
      items = items.filter(
        ar => ar.batchCode.toLowerCase().includes(q) || ar.id.toLowerCase().includes(q)
      )
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })

  const stats = createMemo(() => {
    const data = query.data || []
    const totalAmount = data.reduce((s, ar) => s + Number(ar.amount), 0)
    const collected = data.reduce((s, ar) => s + Number(ar.paidAmount || 0), 0)
    return { total: data.length, totalAmount, collected, outstanding: totalAmount - collected }
  })

  const handleMarkBilled = (ar: AccountReceivable) => {
    updateMutation.mutate({ id: ar.id, status: "billed", billedAt: new Date().toISOString() })
  }

  const openPaymentModal = (ar: AccountReceivable) => {
    setSelectedAr(ar)
    setPaymentAmount(String(Number(ar.amount) - Number(ar.paidAmount || 0)))
    setPaymentNotes("")
    setPaymentModalOpen(true)
  }

  const handleRecordPayment = () => {
    const ar = selectedAr()
    const amount = Number.parseFloat(paymentAmount())
    if (!ar || Number.isNaN(amount) || amount <= 0) return
    paymentMutation.mutate(
      { arId: ar.id, amount, notes: paymentNotes() || undefined },
      {
        onSuccess: () => {
          setPaymentModalOpen(false)
          setSelectedAr(null)
        },
      }
    )
  }

  const exportToCSV = () => {
    const headers = ["Batch Code", "Amount", "Status", "Billed", "Paid", "Created"]
    const rows = filteredAr().map(ar => [
      ar.batchCode,
      ar.amount,
      ar.status,
      ar.billedAt ? formatDate(ar.billedAt) : "",
      ar.paidAmount || 0,
      formatDate(ar.createdAt),
    ])
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `receivables-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Accounts Receivable</h1>
          <p class="text-sm text-gray-500 mt-1">Manage TESDA billing statements and payments</p>
        </div>
        <a
          href="/receivables/create"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Icons.plus class="w-4 h-4" /> Create Billing
        </a>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500 mb-1">Total</p>
          <p class="text-2xl text-gray-900 tabular-nums">{query.data ? stats().total : "-"}</p>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500 mb-1">Total Amount</p>
          <p class="text-2xl text-gray-900 tabular-nums">
            {query.data ? formatCurrency(stats().totalAmount) : "-"}
          </p>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500 mb-1">Collected</p>
          <p class="text-2xl text-green-700 tabular-nums">
            {query.data ? formatCurrency(stats().collected) : "-"}
          </p>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500 mb-1">Outstanding</p>
          <p class="text-2xl text-primary tabular-nums">
            {query.data ? formatCurrency(stats().outstanding) : "-"}
          </p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div class="flex items-center gap-2 flex-wrap">
          <For
            each={[
              { value: "all" as FilterStatus, label: "All" },
              { value: "created" as FilterStatus, label: "Created" },
              { value: "billed" as FilterStatus, label: "Billed" },
              { value: "paid" as FilterStatus, label: "Paid" },
            ]}
          >
            {filter => (
              <button
                type="button"
                onClick={() => setFilterStatus(filter.value)}
                class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus() === filter.value ? "bg-primary text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"}`}
              >
                {filter.label}
              </button>
            )}
          </For>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
            <Icons.search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery()}
              onInput={e => setSearchQuery(e.currentTarget.value)}
              placeholder="Search batch..."
              class="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-56"
            />
          </div>
          <button
            type="button"
            onClick={exportToCSV}
            class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Icons.download class="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <QueryBoundary query={query}>
        {(_data: AccountReceivable[]) => (
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 class="text-sm font-semibold text-gray-900">Receivables</h2>
              <p class="text-xs text-gray-500">{filteredAr().length} records</p>
            </div>
            <Show
              when={filteredAr().length > 0}
              fallback={
                <div class="py-12 text-center">
                  <Icons.receipt class="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p class="text-sm font-medium text-gray-900">No receivables found</p>
                </div>
              }
            >
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th class="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Batch
                      </th>
                      <th class="py-4 px-6 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Amount
                      </th>
                      <th class="py-4 px-6 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th class="py-4 px-6 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Paid
                      </th>
                      <th class="py-4 px-6 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={filteredAr()}>
                      {ar => (
                        <tr class="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                          <td class="py-4 px-6 text-sm text-gray-900">{ar.batchCode}</td>
                          <td class="py-4 px-6 text-right text-sm font-semibold text-gray-900 tabular-nums">
                            {formatCurrency(Number(ar.amount))}
                          </td>
                          <td class="py-4 px-6 text-center">
                            <StatusBadge status={ar.status} />
                          </td>
                          <td class="py-4 px-6 text-right text-sm tabular-nums">
                            {Number(ar.paidAmount || 0) > 0 ? (
                              <span class="text-green-700 font-medium">
                                {formatCurrency(Number(ar.paidAmount))}
                              </span>
                            ) : (
                              <span class="text-gray-400">—</span>
                            )}
                          </td>
                          <td class="py-4 px-6 text-center">
                            <Show when={ar.status === "created"}>
                              <button
                                type="button"
                                onClick={() => handleMarkBilled(ar)}
                                disabled={updateMutation.isPending}
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                              >
                                {updateMutation.isPending ? "Updating..." : "Mark Billed"}
                              </button>
                            </Show>
                            <Show when={ar.status === "billed"}>
                              <button
                                type="button"
                                onClick={() => openPaymentModal(ar)}
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                              >
                                Record Payment
                              </button>
                            </Show>
                            <Show when={ar.status === "paid"}>
                              <span class="text-xs text-green-600">Paid</span>
                            </Show>
                            <Show when={ar.status === "billed" || ar.status === "paid"}>
                              <a
                                href={`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/billing/receivables/${ar.id}/pdf`}
                                target="_blank"
                                rel="noopener"
                                class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 ml-2"
                              >
                                PDF
                              </a>
                            </Show>
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </Show>
          </div>
        )}
      </QueryBoundary>

      <Modal
        open={paymentModalOpen()}
        onClose={() => setPaymentModalOpen(false)}
        title="Record Payment"
      >
        <Show when={selectedAr()}>
          {ar => (
            <div class="space-y-4">
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p class="text-gray-500">Batch</p>
                    <p class="font-medium text-gray-900">{ar().batchCode}</p>
                  </div>
                  <div>
                    <p class="text-gray-500">Total</p>
                    <p class="font-medium text-gray-900">{formatCurrency(Number(ar().amount))}</p>
                  </div>
                  <div>
                    <p class="text-gray-500">Paid</p>
                    <p class="font-medium text-gray-900">
                      {formatCurrency(Number(ar().paidAmount || 0))}
                    </p>
                  </div>
                  <div>
                    <p class="text-gray-500">Remaining</p>
                    <p class="font-semibold text-primary">
                      {formatCurrency(Number(ar().amount) - Number(ar().paidAmount || 0))}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label for="payment-amount" class="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount (PHP)
                </label>
                <input
                  id="payment-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount()}
                  onInput={e => setPaymentAmount(e.currentTarget.value)}
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label for="payment-notes" class="block text-sm font-medium text-gray-700 mb-1">
                  Notes <span class="text-gray-400">(optional)</span>
                </label>
                <textarea
                  id="payment-notes"
                  value={paymentNotes()}
                  onInput={e => setPaymentNotes(e.currentTarget.value)}
                  placeholder="Payment reference..."
                  rows={2}
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
              <Show when={paymentMutation.isError}>
                <div class="p-3 bg-red-50 rounded-lg">
                  <p class="text-xs text-red-700">{paymentMutation.error?.message}</p>
                </div>
              </Show>
              <div class="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRecordPayment}
                  disabled={
                    !paymentAmount() ||
                    Number.parseFloat(paymentAmount()) <= 0 ||
                    paymentMutation.isPending
                  }
                  class="flex-1 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paymentMutation.isPending ? "Processing..." : "Record Payment"}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  class="px-4 py-2.5 bg-white text-gray-700 border border-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Show>
      </Modal>
    </div>
  )
}
