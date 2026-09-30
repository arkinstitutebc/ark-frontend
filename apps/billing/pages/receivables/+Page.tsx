import { formatDatePH, formatPeso, PageContainer, PageHeader, StatCard, THead, Th } from "@ark/ui"
import { useDeleteAr, useReceivables, useRecordPayment, useUpdateAr } from "@data/hooks"
import type { AccountReceivable, ArStatus } from "@data/types"
import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { Icons, Modal, QueryBoundary, StatusBadge } from "@/components/ui"

type FilterStatus = "all" | ArStatus

export default function ReceivablesPage() {
  const [filterStatus, setFilterStatus] = createSignal<FilterStatus>("all")
  const [searchQuery, setSearchQuery] = createSignal("")
  const [page, setPage] = createSignal(1)
  const [paymentModalOpen, setPaymentModalOpen] = createSignal(false)
  const [selectedAr, setSelectedAr] = createSignal<AccountReceivable | null>(null)
  const [paymentAmount, setPaymentAmount] = createSignal("")
  const [paymentNotes, setPaymentNotes] = createSignal("")
  const [editModalOpen, setEditModalOpen] = createSignal(false)
  const [editAmount, setEditAmount] = createSignal("")
  const [editDueDate, setEditDueDate] = createSignal("")
  const [editNotes, setEditNotes] = createSignal("")

  const query = useReceivables(() => ({
    ...(filterStatus() !== "all" ? { status: filterStatus() } : {}),
    page: page(),
    limit: 20,
    search: searchQuery().trim() || undefined,
  }))
  const updateMutation = useUpdateAr()
  const paymentMutation = useRecordPayment()
  const deleteMutation = useDeleteAr()
  const selectedOutstanding = () => {
    const ar = selectedAr()
    if (!ar) return 0
    return Number(ar.amount) - Number(ar.paidAmount || 0)
  }
  const paymentValue = () => {
    const value = Number.parseFloat(paymentAmount())
    return Number.isNaN(value) ? 0 : value
  }
  const paymentError = () => {
    if (!paymentAmount()) return ""
    if (paymentValue() <= 0) return "Payment must be greater than zero."
    if (paymentValue() > selectedOutstanding()) return "Payment exceeds the outstanding balance."
    return ""
  }

  const filteredAr = createMemo(() => query.data?.items ?? [])
  const pageCount = createMemo(() =>
    query.data ? Math.max(1, Math.ceil(query.data.total / query.data.limit)) : 1
  )

  createEffect(() => {
    filterStatus()
    searchQuery()
    setPage(1)
  })

  const stats = createMemo(() => {
    const summary = query.data?.summary
    return {
      total: query.data?.total ?? 0,
      totalAmount: summary?.totalAmount ?? 0,
      collected: summary?.paidAmount ?? 0,
      outstanding: summary?.outstandingAmount ?? 0,
    }
  })

  const openPaymentModal = (ar: AccountReceivable) => {
    setSelectedAr(ar)
    setPaymentAmount(String(Number(ar.amount) - Number(ar.paidAmount || 0)))
    setPaymentNotes("")
    setPaymentModalOpen(true)
  }

  const openEditModal = (ar: AccountReceivable) => {
    setSelectedAr(ar)
    setEditAmount(String(Number(ar.amount)))
    setEditDueDate(ar.dueDate ?? "")
    setEditNotes(ar.notes ?? "")
    setEditModalOpen(true)
  }

  const handleSaveEdit = () => {
    const ar = selectedAr()
    const amount = Number(editAmount())
    if (!ar || !Number.isFinite(amount) || amount <= 0) return
    updateMutation.mutate(
      {
        id: ar.id,
        ...(Number(ar.paidAmount ?? 0) === 0 ? { amount } : {}),
        dueDate: editDueDate() || undefined,
        notes: editNotes() || undefined,
      },
      { onSuccess: () => setEditModalOpen(false) }
    )
  }

  const handleDelete = (ar: AccountReceivable) => {
    if (!window.confirm(`Delete the unpaid receivable for ${ar.batchCode}?`)) return
    deleteMutation.mutate(ar.id)
  }

  const handleRecordPayment = () => {
    const ar = selectedAr()
    const amount = paymentValue()
    if (!ar || amount <= 0 || amount > selectedOutstanding()) return
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
      ar.billedAt ? formatDatePH(ar.billedAt) : "",
      ar.paidAmount || 0,
      formatDatePH(ar.createdAt),
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
    <PageContainer>
      <PageHeader title="Accounts Receivable" subtitle="Synced from Training batches" />

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total" numeric value={query.data ? stats().total : "-"} />
        <StatCard
          label="Total Revenue"
          numeric
          value={query.data ? formatPeso(stats().totalAmount) : "-"}
        />
        <StatCard
          label="Total Debited Amount"
          numeric
          valueClass="text-green-700"
          value={query.data ? formatPeso(stats().collected) : "-"}
        />
        <StatCard
          label="Outstanding Receivables"
          numeric
          valueClass="text-red-700"
          value={query.data ? formatPeso(stats().outstanding) : "-"}
        />
      </div>

      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div class="flex items-center gap-2 flex-wrap">
          <For
            each={[
              { value: "all" as FilterStatus, label: "All" },
              { value: "unpaid" as FilterStatus, label: "Unpaid" },
              { value: "partially_paid" as FilterStatus, label: "Partially Paid" },
              { value: "overdue" as FilterStatus, label: "Overdue" },
              { value: "paid" as FilterStatus, label: "Paid" },
              { value: "cancelled" as FilterStatus, label: "Cancelled" },
            ]}
          >
            {filter => (
              <button
                type="button"
                onClick={() => setFilterStatus(filter.value)}
                class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus() === filter.value ? "bg-primary text-white" : "bg-surface text-foreground border border-border hover:bg-surface-muted"}`}
              >
                {filter.label}
              </button>
            )}
          </For>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
            <Icons.search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={searchQuery()}
              onInput={e => setSearchQuery(e.currentTarget.value)}
              placeholder="Search batch..."
              class="pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-56"
            />
          </div>
          <button
            type="button"
            onClick={exportToCSV}
            class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted transition-colors"
          >
            <Icons.download class="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <QueryBoundary query={query}>
        {data => (
          <div class="bg-surface rounded-lg border border-border overflow-hidden">
            <div class="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 class="text-sm font-semibold text-foreground">Receivables</h2>
              <p class="text-xs text-muted">
                {filteredAr().length} of {data.total} records
              </p>
            </div>
            <Show
              when={filteredAr().length > 0}
              fallback={
                <div class="py-12 text-center">
                  <Icons.receipt class="w-12 h-12 mx-auto mb-3 text-muted" />
                  <p class="text-sm font-medium text-foreground">No receivables found</p>
                </div>
              }
            >
              <div class="overflow-x-auto">
                <table class="w-full">
                  <THead>
                    <Th>Batch</Th>
                    <Th align="right">Gross Revenue</Th>
                    <Th align="right">Net 98%</Th>
                    <Th align="center">Status</Th>
                    <Th align="right">Paid</Th>
                    <Th align="center">Actions</Th>
                  </THead>
                  <tbody>
                    <For each={filteredAr()}>
                      {ar => (
                        <tr class="border-t border-border hover:bg-surface-muted transition-colors">
                          <td class="py-4 px-6 text-sm text-foreground">{ar.batchCode}</td>
                          <td class="py-4 px-6 text-right text-sm font-semibold text-foreground tabular-nums">
                            {formatPeso(Number(ar.amount))}
                          </td>
                          <td class="py-4 px-6 text-right text-sm text-foreground tabular-nums">
                            {formatPeso(ar.netRevenue)}
                          </td>
                          <td class="py-4 px-6 text-center">
                            <StatusBadge status={ar.status} />
                          </td>
                          <td class="py-4 px-6 text-right text-sm tabular-nums">
                            {Number(ar.paidAmount || 0) > 0 ? (
                              <span class="text-green-700 font-medium">
                                {formatPeso(Number(ar.paidAmount))}
                              </span>
                            ) : (
                              <span class="text-muted">—</span>
                            )}
                          </td>
                          <td class="py-4 px-6 text-center">
                            <Show
                              when={["unpaid", "partially_paid", "overdue"].includes(ar.status)}
                            >
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
                            <button
                              type="button"
                              onClick={() => openEditModal(ar)}
                              class="ml-2 inline-flex px-2 py-1 text-xs font-medium text-muted hover:text-foreground"
                            >
                              Edit
                            </button>
                            <Show
                              when={
                                Number(ar.paidAmount ?? 0) === 0 &&
                                ar.status !== "paid" &&
                                ar.status !== "partially_paid"
                              }
                            >
                              <button
                                type="button"
                                onClick={() => handleDelete(ar)}
                                class="inline-flex px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </Show>
                            <a
                              href={`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/billing/receivables/${ar.id}/pdf`}
                              target="_blank"
                              rel="noopener"
                              class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted hover:text-foreground"
                            >
                              PDF
                            </a>
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </Show>
            <Show when={data.total > data.limit}>
              <div class="flex items-center justify-between border-t border-border px-5 py-3">
                <p class="text-xs text-muted">
                  Page {page()} of {pageCount()}
                </p>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page() <= 1 || query.isFetching}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    class="px-3 py-1.5 rounded-md border border-border text-xs font-medium text-foreground hover:bg-surface-muted disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page() >= pageCount() || query.isFetching}
                    onClick={() => setPage(p => Math.min(pageCount(), p + 1))}
                    class="px-3 py-1.5 rounded-md border border-border text-xs font-medium text-foreground hover:bg-surface-muted disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
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
              <div class="bg-surface-muted rounded-lg p-4">
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p class="text-muted">Batch</p>
                    <p class="font-medium text-foreground">{ar().batchCode}</p>
                  </div>
                  <div>
                    <p class="text-muted">Total</p>
                    <p class="font-medium text-foreground">{formatPeso(Number(ar().amount))}</p>
                  </div>
                  <div>
                    <p class="text-muted">Paid</p>
                    <p class="font-medium text-foreground">
                      {formatPeso(Number(ar().paidAmount || 0))}
                    </p>
                  </div>
                  <div>
                    <p class="text-muted">Remaining</p>
                    <p class="font-semibold text-primary">{formatPeso(selectedOutstanding())}</p>
                  </div>
                </div>
              </div>
              <div>
                <label for="payment-amount" class="block text-sm font-medium text-foreground mb-1">
                  Payment Amount (PHP)
                </label>
                <input
                  id="payment-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount()}
                  onInput={e => setPaymentAmount(e.currentTarget.value)}
                  class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <Show when={paymentError()}>
                  <p class="text-xs text-red-600 mt-1">{paymentError()}</p>
                </Show>
              </div>
              <div>
                <label for="payment-notes" class="block text-sm font-medium text-foreground mb-1">
                  Notes <span class="text-muted">(optional)</span>
                </label>
                <textarea
                  id="payment-notes"
                  value={paymentNotes()}
                  onInput={e => setPaymentNotes(e.currentTarget.value)}
                  placeholder="Payment reference..."
                  rows={2}
                  class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
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
                  disabled={!paymentAmount() || !!paymentError() || paymentMutation.isPending}
                  class="flex-1 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paymentMutation.isPending ? "Processing..." : "Record Payment"}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  class="px-4 py-2.5 bg-surface text-foreground border border-border text-sm font-medium rounded-lg hover:bg-surface-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Show>
      </Modal>

      <Modal open={editModalOpen()} onClose={() => setEditModalOpen(false)} title="Edit Receivable">
        <div class="space-y-4">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-foreground">Gross Revenue</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={editAmount()}
              disabled={Number(selectedAr()?.paidAmount ?? 0) > 0}
              onInput={event => setEditAmount(event.currentTarget.value)}
              class="w-full rounded-lg border border-border px-3 py-2 text-sm disabled:bg-surface-muted"
            />
            <Show when={Number(selectedAr()?.paidAmount ?? 0) > 0}>
              <p class="mt-1 text-xs text-muted">Locked after the first payment.</p>
            </Show>
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-foreground">Due Date</span>
            <input
              type="date"
              value={editDueDate()}
              onInput={event => setEditDueDate(event.currentTarget.value)}
              class="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-foreground">Notes</span>
            <textarea
              rows={3}
              value={editNotes()}
              onInput={event => setEditNotes(event.currentTarget.value)}
              class="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </label>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              class="rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
              class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  )
}
