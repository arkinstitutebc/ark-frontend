import { categoryToneClass, formatDatePH, formatPeso, PageContainer, PageHeader } from "@ark/ui"
import { useApprovePr, useCoordinatorReviewPr, useRejectPr, useRequests } from "@data/hooks"
import type { PrStatus, PurchaseRequest } from "@data/types"
import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { type ApprovalAction, ApprovalDetailsModal } from "@/components/approval-details-modal"
import { Icons, QueryBoundary, StatusBadge } from "@/components/ui"

function getEmptyStateMessage(filter: PrStatus | "all") {
  switch (filter) {
    case "pending":
      return {
        icon: Icons.checkCircle,
        title: "No requests awaiting coordinator review",
        message: "Newly submitted purchase requests will show here.",
      }
    case "under_review":
      return {
        icon: Icons.checkCircle,
        title: "No requests awaiting management approval",
        message: "Coordinator-reviewed requests will show here.",
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
  onCoordinatorReview: (pr: PurchaseRequest) => void
  onApprove: (pr: PurchaseRequest) => void
  onReject: (pr: PurchaseRequest) => void
  onViewDetails: (pr: PurchaseRequest) => void
  processing: boolean
}) {
  const pdfUrl = () =>
    `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/procurement/requests/${props.pr.id}/pdf`
  const itemsSummary = () => {
    const items = props.pr.items
    const count = items.length
    const first = items[0]
    if (count === 1) {
      return `1 item: ${first.name} x ${first.quantity} ${first.unit}`
    }
    return `${count} items: ${first.name} x ${first.quantity} ${first.unit}`
  }

  return (
    <div class="bg-surface rounded-lg border border-border p-6 hover:shadow-md transition-all">
      {/* Header */}
      <div class="flex items-start justify-between mb-4">
        <span class="font-mono text-sm font-medium text-foreground">{props.pr.prCode}</span>
        <StatusBadge status={props.pr.status} />
      </div>

      {/* Batch info */}
      <p class="text-sm text-muted mb-1 flex items-center gap-2 flex-wrap">
        <span>{props.pr.batchName}</span>
        <span class="text-muted">|</span>
        <span>{props.pr.batchCode}</span>
        <Show when={props.pr.category}>
          <span class="text-muted">|</span>
          <span
            class={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${categoryToneClass(props.pr.category)}`}
          >
            {props.pr.category}
          </span>
        </Show>
      </p>

      {/* Purpose */}
      <p class="text-sm text-foreground mb-4 truncate" title={props.pr.purpose}>
        {props.pr.purpose}
      </p>

      {/* Items summary */}
      <div class="flex items-center justify-between mb-4">
        <p class="text-xs text-muted">{itemsSummary()}</p>
        <div class="flex items-center gap-3">
          <button
            type="button"
            onClick={() => props.onViewDetails(props.pr)}
            class="flex items-center gap-1 text-xs text-primary hover:text-primary/80 cursor-pointer"
          >
            <Icons.fileText class="w-3.5 h-3.5" /> Show more details
          </button>
          <a
            href={pdfUrl()}
            target="_blank"
            rel="noopener"
            class="flex items-center gap-1 text-xs text-muted hover:text-foreground cursor-pointer"
            title="View PDF"
          >
            <Icons.fileText class="w-3.5 h-3.5" /> View PDF
          </a>
        </div>
      </div>

      {/* Footer */}
      <div class="flex items-center justify-between pt-4 border-t border-border">
        <div>
          <span class="text-sm font-medium text-foreground">
            {formatPeso(Number(props.pr.totalAmount))}
          </span>
          <span class="text-muted mx-2">|</span>
          <span class="text-xs text-muted">
            Created {formatDatePH(props.pr.createdAt)} by {props.pr.createdBy}
          </span>
        </div>

        <Show
          when={props.pr.status === "pending" || props.pr.status === "under_review"}
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
            <Show when={props.pr.status === "pending"}>
              <button
                type="button"
                disabled={props.processing}
                onClick={() => props.onCoordinatorReview(props.pr)}
                class="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95 rounded transition-all disabled:opacity-50 cursor-pointer"
              >
                Coordinator Review
              </button>
            </Show>
            <Show when={props.pr.status === "under_review"}>
              <button
                type="button"
                disabled={props.processing}
                onClick={() => props.onApprove(props.pr)}
                class="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95 rounded transition-all disabled:opacity-50 cursor-pointer"
              >
                Approve
              </button>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  )
}

export default function ApprovalsPage() {
  const approveMutation = useApprovePr()
  const rejectMutation = useRejectPr()
  const coordinatorReviewMutation = useCoordinatorReviewPr()

  const [filter, setFilter] = createSignal<PrStatus | "all">("pending")
  const [search, setSearch] = createSignal("")
  const [page, setPage] = createSignal(1)
  const [selectedPr, setSelectedPr] = createSignal<PurchaseRequest | null>(null)
  const [modalOpen, setModalOpen] = createSignal(false)
  const [modalMode, setModalMode] = createSignal<ApprovalAction>("view")
  const query = useRequests(() => ({
    ...(filter() !== "all" ? { status: filter() } : {}),
    page: page(),
    limit: 20,
    search: search().trim() || undefined,
  }))

  const isProcessing = () =>
    approveMutation.isPending || rejectMutation.isPending || coordinatorReviewMutation.isPending

  const requests = createMemo(() => query.data?.items ?? [])
  const pageCount = createMemo(() =>
    query.data ? Math.max(1, Math.ceil(query.data.total / query.data.limit)) : 1
  )

  createEffect(() => {
    filter()
    search()
    setPage(1)
  })

  const stats = createMemo(() => {
    const byStatus = query.data?.summary.byStatus
    return {
      total: query.data?.total ?? 0,
      pending: byStatus?.pending?.count ?? 0,
      underReview: byStatus?.under_review?.count ?? 0,
      approved: byStatus?.approved?.count ?? 0,
      rejected: byStatus?.rejected?.count ?? 0,
    }
  })

  const openModal = (pr: PurchaseRequest, mode: ApprovalAction) => {
    setSelectedPr(pr)
    setModalMode(mode)
    setModalOpen(true)
  }

  const handleCoordinatorReview = (pr: PurchaseRequest) => openModal(pr, "coordinator-review")
  const handleApprove = (pr: PurchaseRequest) => openModal(pr, "approve")
  const handleReject = (pr: PurchaseRequest) => openModal(pr, "reject")
  const handleViewDetails = (pr: PurchaseRequest) => openModal(pr, "view")

  const handleModalApprove = (id: string, notes?: string) => {
    approveMutation.mutate(
      { id, approvalNotes: notes },
      {
        onSuccess: () => setModalOpen(false),
      }
    )
  }

  const handleModalCoordinatorReview = (id: string, notes?: string) => {
    coordinatorReviewMutation.mutate(
      { id, notes },
      {
        onSuccess: () => setModalOpen(false),
      }
    )
  }

  const handleModalReject = (id: string, notes: string) => {
    rejectMutation.mutate(
      { id, approvalNotes: notes },
      {
        onSuccess: () => setModalOpen(false),
      }
    )
  }

  return (
    <PageContainer>
      <PageHeader title="Approvals" subtitle="Review and approve purchase requests" />

      {/* Error banner */}
      <Show
        when={
          approveMutation.isError || rejectMutation.isError || coordinatorReviewMutation.isError
        }
      >
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {approveMutation.error?.message ||
            rejectMutation.error?.message ||
            coordinatorReviewMutation.error?.message}
        </div>
      </Show>

      <div class="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted mb-1">Total</p>
          <p class="text-2xl text-foreground">{query.isSuccess ? stats().total : "-"}</p>
        </div>
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted mb-1">Coordinator queue</p>
          <p class="text-2xl text-foreground">{query.isSuccess ? stats().pending : "-"}</p>
        </div>
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted mb-1">Management queue</p>
          <p class="text-2xl text-foreground">{query.isSuccess ? stats().underReview : "-"}</p>
        </div>
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted mb-1">Approved</p>
          <p class="text-2xl text-foreground">{query.isSuccess ? stats().approved : "-"}</p>
        </div>
        <div class="bg-surface rounded-lg border border-border p-4">
          <p class="text-sm text-muted mb-1">Rejected</p>
          <p class="text-2xl text-foreground">{query.isSuccess ? stats().rejected : "-"}</p>
        </div>
      </div>

      {/* Filters */}
      <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <div class="relative flex-1">
          <Icons.search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by PR #, batch, or category..."
            value={search()}
            onInput={e => setSearch(e.currentTarget.value)}
            class="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div class="flex gap-2">
          <For
            each={[
              { value: "all" as const, label: "All" },
              { value: "pending" as const, label: "Coordinator queue" },
              { value: "under_review" as const, label: "Management queue" },
              { value: "approved" as const, label: "Approved" },
              { value: "rejected" as const, label: "Rejected" },
            ]}
          >
            {item => (
              <button
                type="button"
                onClick={() => setFilter(item.value)}
                class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter() === item.value ? "bg-primary text-white" : "bg-surface text-foreground border border-border hover:bg-surface-muted"}`}
              >
                {item.label}
              </button>
            )}
          </For>
        </div>
      </div>

      {/* Card Grid */}
      <QueryBoundary query={query}>
        {data => (
          <>
            <Show
              when={requests().length > 0}
              fallback={(() => {
                const emptyState = getEmptyStateMessage(filter())
                return (
                  <div class="py-16 text-center">
                    <emptyState.icon class="w-12 h-12 mx-auto mb-3 text-muted" />
                    <p class="text-sm font-medium text-foreground">{emptyState.title}</p>
                    <p class="text-sm text-muted mt-1">{emptyState.message}</p>
                  </div>
                )
              })()}
            >
              <div class="grid grid-cols-1 gap-4">
                <For each={requests()}>
                  {pr => (
                    <ApprovalCard
                      pr={pr}
                      onCoordinatorReview={handleCoordinatorReview}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onViewDetails={handleViewDetails}
                      processing={isProcessing()}
                    />
                  )}
                </For>
              </div>
            </Show>
            <Show when={data.total > data.limit}>
              <div class="mt-4 flex items-center justify-between">
                <p class="text-xs text-muted">
                  Page {page()} of {pageCount()} · {data.total} requests
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
          </>
        )}
      </QueryBoundary>

      {/* Approval Details Modal */}
      <ApprovalDetailsModal
        open={modalOpen()}
        onClose={() => setModalOpen(false)}
        pr={selectedPr()}
        mode={modalMode()}
        onApprove={handleModalApprove}
        onReject={handleModalReject}
        onCoordinatorReview={handleModalCoordinatorReview}
        processing={isProcessing()}
      />
    </PageContainer>
  )
}
