import { useApprovePr, useRejectPr, useRequests } from "@data/hooks"
import type { PrStatus, PurchaseRequest } from "@data/types"
import { createMemo, createSignal, For, Show } from "solid-js"
import { ApprovalDetailsModal } from "@/components/approval-details-modal"
import { Icons, PrStatusBadge, QueryBoundary } from "@/components/ui"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount)
}

const StatusBadge = PrStatusBadge

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr))
}

function getEmptyStateMessage(filter: PrStatus | "all") {
  switch (filter) {
    case "pending":
      return {
        icon: Icons.checkCircle,
        title: "No pending approvals",
        message: "All purchase requests have been reviewed.",
      }
    case "approved":
      return {
        icon: Icons.checkCircle,
        title: "No approved requests",
        message: "No requests have been approved yet.",
      }
    case "rejected":
      return {
        icon: Icons.xCircle,
        title: "No rejected requests",
        message: "No requests have been rejected.",
      }
    default:
      return {
        icon: Icons.fileText,
        title: "No purchase requests",
        message: "Create a purchase request to get started.",
      }
  }
}

function ApprovalCard(props: {
  pr: PurchaseRequest
  onApprove: (id: string) => void
  onReject: (pr: PurchaseRequest) => void
  onViewDetails: (pr: PurchaseRequest) => void
  processing: boolean
}) {
  const itemsSummary = () => {
    const items = props.pr.items as Array<any>
    const count = items.length
    const first = items[0]
    if (count === 1) {
      return `1 item: ${first.name} x ${first.quantity} ${first.unit}`
    }
    return `${count} items: ${first.name} x ${first.quantity} ${first.unit}`
  }

  return (
    <div class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all">
      {/* Header */}
      <div class="flex items-start justify-between mb-4">
        <span class="font-mono text-sm font-medium text-gray-900">{props.pr.prCode}</span>
        <StatusBadge status={props.pr.status} />
      </div>

      {/* Batch info */}
      <p class="text-sm text-gray-600 mb-1">
        {props.pr.batchName} <span class="text-gray-400">|</span> {props.pr.batchCode}{" "}
        <span class="text-gray-400">|</span> {props.pr.category}
      </p>

      {/* Purpose */}
      <p class="text-sm text-gray-900 mb-4 truncate" title={props.pr.purpose}>
        {props.pr.purpose}
      </p>

      {/* Items summary */}
      <div class="flex items-center justify-between mb-4">
        <p class="text-xs text-gray-500">{itemsSummary()}</p>
        <div class="flex items-center gap-3">
          <button
            type="button"
            onClick={() => props.onViewDetails(props.pr)}
            class="flex items-center gap-1 text-xs text-primary hover:text-primary/80 cursor-pointer"
          >
            <Icons.fileText class="w-3.5 h-3.5" /> Show more details
          </button>
          <button
            type="button"
            onClick={() => props.onViewDetails(props.pr)}
            class="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
            title="View PDF"
          >
            <Icons.fileText class="w-3.5 h-3.5" /> View PDF
          </button>
        </div>
      </div>

      {/* Footer */}
      <div class="flex items-center justify-between pt-4 border-t border-gray-100">
        <div>
          <span class="text-sm font-medium text-gray-900">
            {formatCurrency(Number(props.pr.totalAmount))}
          </span>
          <span class="text-gray-400 mx-2">|</span>
          <span class="text-xs text-gray-500">
            Created {formatDate(props.pr.createdAt)} by {props.pr.createdBy}
          </span>
        </div>

        <Show
          when={props.pr.status === "pending"}
          fallback={
            <button
              type="button"
              onClick={() => props.onViewDetails(props.pr)}
              class="text-primary text-sm font-medium hover:text-primary/80 hover:underline cursor-pointer"
            >
              View details
            </button>
          }
        >
          <div class="flex items-center gap-2">
            <button
              type="button"
              disabled={props.processing}
              onClick={() => props.onReject(props.pr)}
              class="px-3 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent/90 hover:scale-105 active:scale-95 rounded transition-all disabled:opacity-50 cursor-pointer"
            >
              Reject
            </button>
            <button
              type="button"
              disabled={props.processing}
              onClick={() => props.onApprove(props.pr.id)}
              class="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95 rounded transition-all disabled:opacity-50 cursor-pointer"
            >
              Approve
            </button>
          </div>
        </Show>
      </div>
    </div>
  )
}

export default function ApprovalsPage() {
  const query = useRequests()
  const approveMutation = useApprovePr()
  const rejectMutation = useRejectPr()

  const [filter, setFilter] = createSignal<PrStatus | "all">("pending")
  const [search, setSearch] = createSignal("")
  const [selectedPr, setSelectedPr] = createSignal<PurchaseRequest | null>(null)
  const [modalOpen, setModalOpen] = createSignal(false)

  const isProcessing = () => approveMutation.isPending || rejectMutation.isPending

  const filteredRequests = createMemo(() => {
    const data = query.data || []
    return data.filter(r => {
      const matchStatus = filter() === "all" || r.status === filter()
      const matchSearch =
        !search() ||
        r.prCode?.toLowerCase().includes(search().toLowerCase()) ||
        r.batchName?.toLowerCase().includes(search().toLowerCase()) ||
        r.category?.toLowerCase().includes(search().toLowerCase())
      return matchStatus && matchSearch
    })
  })

  const stats = createMemo(() => {
    const data = query.data || []
    return {
      total: data.length,
      pending: data.filter(r => r.status === "pending").length,
      approved: data.filter(r => r.status === "approved").length,
      rejected: data.filter(r => r.status === "rejected").length,
    }
  })

  const handleApprove = (id: string) => {
    approveMutation.mutate({ id, approvalNotes: "Approved for procurement." })
  }

  const handleReject = (pr: PurchaseRequest) => {
    setSelectedPr(pr)
    setModalOpen(true)
  }

  const handleViewDetails = (pr: PurchaseRequest) => {
    setSelectedPr(pr)
    setModalOpen(true)
  }

  const handleModalApprove = (id: string, notes?: string) => {
    approveMutation.mutate(
      { id, approvalNotes: notes || "Approved for procurement." },
      {
        onSuccess: () => setModalOpen(false),
      }
    )
  }

  const handleModalReject = (id: string, notes?: string) => {
    rejectMutation.mutate(
      { id, approvalNotes: notes || "Request rejected." },
      {
        onSuccess: () => setModalOpen(false),
      }
    )
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Approvals</h1>
          <p class="text-sm text-gray-500 mt-1">Review and approve purchase requests</p>
        </div>
      </div>

      {/* Error banner */}
      <Show when={approveMutation.isError || rejectMutation.isError}>
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {approveMutation.error?.message || rejectMutation.error?.message}
        </div>
      </Show>

      {/* Stats */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500 mb-1">Total</p>
          <p class="text-2xl text-gray-900">{query.isSuccess ? stats().total : "-"}</p>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500 mb-1">Pending</p>
          <p class="text-2xl text-gray-900">{query.isSuccess ? stats().pending : "-"}</p>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500 mb-1">Approved</p>
          <p class="text-2xl text-gray-900">{query.isSuccess ? stats().approved : "-"}</p>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500 mb-1">Rejected</p>
          <p class="text-2xl text-gray-900">{query.isSuccess ? stats().rejected : "-"}</p>
        </div>
      </div>

      {/* Filters */}
      <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <div class="relative flex-1">
          <Icons.search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by PR #, batch, or category..."
            value={search()}
            onInput={e => setSearch(e.currentTarget.value)}
            class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div class="flex gap-2">
          <For
            each={[
              { value: "all" as const, label: "All" },
              { value: "pending" as const, label: "Pending" },
              { value: "approved" as const, label: "Approved" },
              { value: "rejected" as const, label: "Rejected" },
            ]}
          >
            {item => (
              <button
                type="button"
                onClick={() => setFilter(item.value)}
                class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter() === item.value ? "bg-primary text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"}`}
              >
                {item.label}
              </button>
            )}
          </For>
        </div>
      </div>

      {/* Card Grid */}
      <QueryBoundary query={query}>
        {(_data: PurchaseRequest[]) => (
          <Show
            when={filteredRequests().length > 0}
            fallback={(() => {
              const emptyState = getEmptyStateMessage(filter())
              return (
                <div class="py-16 text-center">
                  <emptyState.icon class="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p class="text-sm font-medium text-gray-900">{emptyState.title}</p>
                  <p class="text-sm text-gray-500 mt-1">{emptyState.message}</p>
                </div>
              )
            })()}
          >
            <div class="grid grid-cols-1 gap-4">
              <For each={filteredRequests()}>
                {pr => (
                  <ApprovalCard
                    pr={pr}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onViewDetails={handleViewDetails}
                    processing={isProcessing()}
                  />
                )}
              </For>
            </div>
          </Show>
        )}
      </QueryBoundary>

      {/* Approval Details Modal */}
      <ApprovalDetailsModal
        open={modalOpen()}
        onClose={() => setModalOpen(false)}
        pr={selectedPr()}
        onApprove={handleModalApprove}
        onReject={handleModalReject}
        processing={isProcessing()}
      />
    </div>
  )
}
