import { useCurrentUser } from "@ark/api-client"
import {
  Button,
  DataTable,
  formatDatePH,
  formatPeso,
  Icons,
  Modal,
  ModalFooter,
  PageContainer,
  PageHeader,
  StatCard,
  THead,
  Th,
} from "@ark/ui"
import { usePettyCashRequests, usePettyCashSummary, useUpsertPettyCashFund } from "@data/hooks"
import { pettyCashFundSchema } from "@data/schemas"
import type { PettyCashRequest, PettyCashStatus } from "@data/types"
import { validateForm } from "@data/validate"
import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { navigate } from "vike/client/router"
import { pettyCashReleaseMethodLabels } from "@/components/petty-cash"
import { QueryBoundary, StatusBadge } from "@/components/ui"

const filters: { value: PettyCashStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "released", label: "Released" },
  { value: "liquidated", label: "Liquidated" },
]

function FundSetupModal(props: {
  open: boolean
  onClose: () => void
  summary?: ReturnType<typeof usePettyCashSummary>["data"]
}) {
  const saveFund = useUpsertPettyCashFund()
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [name, setName] = createSignal("Petty Cash Fund")
  const [initialAmount, setInitialAmount] = createSignal("")
  const [adjustmentAmount, setAdjustmentAmount] = createSignal("")
  const [notes, setNotes] = createSignal("")

  createEffect(() => {
    const fund = props.summary?.fund
    if (!props.open || !fund) return
    setName(fund.name)
    setInitialAmount(String(fund.initialAmount ?? ""))
    setAdjustmentAmount(String(fund.adjustmentAmount ?? ""))
    setNotes(fund.notes ?? "")
  })

  const handleSubmit = (event: Event) => {
    event.preventDefault()
    const result = validateForm(pettyCashFundSchema, {
      name: name(),
      initialAmount: Number(initialAmount() || 0),
      adjustmentAmount: Number(adjustmentAmount() || 0),
    })
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    saveFund.mutate(
      {
        name: name().trim(),
        initialAmount: Number(initialAmount() || 0).toFixed(2),
        adjustmentAmount: Number(adjustmentAmount() || 0).toFixed(2),
        notes: notes().trim() || undefined,
      },
      {
        onSuccess: () => props.onClose(),
      }
    )
  }

  return (
    <Modal open={props.open} onClose={props.onClose} title="Petty Cash Setup" size="lg">
      <form onSubmit={handleSubmit} class="space-y-5">
        <div class="rounded-lg border border-border bg-surface-muted px-4 py-3">
          <p class="text-sm font-medium text-foreground">
            Set the cash amount available for petty cash requests.
          </p>
        </div>
        <div>
          <label for="pc-fund-name" class="mb-1 block text-sm font-medium text-foreground">
            Fund Name
          </label>
          <input
            id="pc-fund-name"
            value={name()}
            onInput={e => setName(e.currentTarget.value)}
            class={`w-full rounded-lg border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              errors().name ? "border-red-300" : "border-border"
            }`}
          />
          <Show when={errors().name}>
            <p class="mt-1 text-xs text-red-600">{errors().name}</p>
          </Show>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label for="pc-initial" class="mb-1 block text-sm font-medium text-foreground">
              Starting Cash
            </label>
            <input
              id="pc-initial"
              type="number"
              min="0"
              step="0.01"
              value={initialAmount()}
              onInput={e => setInitialAmount(e.currentTarget.value)}
              class={`w-full rounded-lg border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                errors().initialAmount ? "border-red-300" : "border-border"
              }`}
            />
            <Show when={errors().initialAmount}>
              <p class="mt-1 text-xs text-red-600">{errors().initialAmount}</p>
            </Show>
          </div>
          <div>
            <label for="pc-adjustment" class="mb-1 block text-sm font-medium text-foreground">
              Extra Cash Added
            </label>
            <input
              id="pc-adjustment"
              type="number"
              min="0"
              step="0.01"
              value={adjustmentAmount()}
              onInput={e => setAdjustmentAmount(e.currentTarget.value)}
              class={`w-full rounded-lg border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                errors().adjustmentAmount ? "border-red-300" : "border-border"
              }`}
            />
            <Show when={errors().adjustmentAmount}>
              <p class="mt-1 text-xs text-red-600">{errors().adjustmentAmount}</p>
            </Show>
          </div>
        </div>
        <div>
          <label for="pc-fund-notes" class="mb-1 block text-sm font-medium text-foreground">
            Notes
          </label>
          <textarea
            id="pc-fund-notes"
            rows={3}
            value={notes()}
            onInput={e => setNotes(e.currentTarget.value)}
            class="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <ModalFooter
          onCancel={props.onClose}
          submitInForm
          submitLabel="Save Fund"
          submitting={saveFund.isPending}
          submitLoadingLabel="Saving..."
        />
      </form>
    </Modal>
  )
}

export default function PettyCashPage() {
  const userQuery = useCurrentUser()
  const isAdmin = createMemo(() => userQuery.data?.role === "admin")
  const [filter, setFilter] = createSignal<PettyCashStatus | "all">("all")
  const [search, setSearch] = createSignal("")
  const [page, setPage] = createSignal(1)
  const [fundOpen, setFundOpen] = createSignal(false)
  const requestsQuery = usePettyCashRequests(() => ({
    status: filter(),
    search: search().trim() || undefined,
    page: page(),
    limit: 20,
  }))
  const summaryQuery = usePettyCashSummary(isAdmin)
  const requests = createMemo(() => requestsQuery.data?.items ?? [])
  const pageCount = createMemo(() =>
    requestsQuery.data
      ? Math.max(1, Math.ceil(requestsQuery.data.total / requestsQuery.data.limit))
      : 1
  )

  createEffect(() => {
    filter()
    search()
    setPage(1)
  })

  const stats = createMemo(() => {
    const byStatus = requestsQuery.data?.summary.byStatus
    return {
      total: requestsQuery.data?.total ?? 0,
      pending: byStatus?.pending?.count ?? 0,
      released: byStatus?.released?.count ?? 0,
      liquidated: byStatus?.liquidated?.count ?? 0,
    }
  })

  return (
    <PageContainer>
      <PageHeader
        title="Petty Cash"
        subtitle="Track cash requests, releases, liquidation, and receipts."
        action={
          <div class="flex flex-wrap items-center gap-2">
            <Show when={isAdmin()}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setFundOpen(true)}>
                Cash Setup
              </Button>
            </Show>
            <Button type="button" size="sm" onClick={() => navigate("/petty-cash/new")}>
              <Icons.plus class="h-4 w-4" />
              New Request
            </Button>
          </div>
        }
      />

      <Show
        when={isAdmin()}
        fallback={
          <div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="My Requests" value={requestsQuery.isSuccess ? stats().total : "-"} />
            <StatCard label="Pending" value={requestsQuery.isSuccess ? stats().pending : "-"} />
            <StatCard label="Released" value={requestsQuery.isSuccess ? stats().released : "-"} />
            <StatCard
              label="Liquidated"
              value={requestsQuery.isSuccess ? stats().liquidated : "-"}
            />
          </div>
        }
      >
        <div class="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            label="Current Balance"
            value={summaryQuery.data ? formatPeso(summaryQuery.data.remainingBalance) : "-"}
          />
          <StatCard
            label="Total Released"
            value={summaryQuery.data ? formatPeso(summaryQuery.data.totalReleased) : "-"}
          />
          <StatCard
            label="Total Spent"
            value={summaryQuery.data ? formatPeso(summaryQuery.data.totalLiquidated) : "-"}
          />
          <StatCard label="Receipts Needed" value={summaryQuery.data?.pendingLiquidations ?? "-"} />
        </div>
      </Show>

      <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div class="relative flex-1">
          <Icons.search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search number, requester, department, or purpose..."
            value={search()}
            onInput={e => setSearch(e.currentTarget.value)}
            class="w-full rounded-lg border border-border py-2 pl-9 pr-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div class="flex gap-2 overflow-x-auto">
          <For each={filters}>
            {item => (
              <Button
                type="button"
                size="sm"
                variant={filter() === item.value ? "primary" : "secondary"}
                onClick={() => setFilter(item.value)}
                class="whitespace-nowrap"
              >
                {item.label}
              </Button>
            )}
          </For>
        </div>
      </div>

      <QueryBoundary query={requestsQuery}>
        {data => (
          <div class="overflow-hidden rounded-lg border border-border bg-surface">
            <Show
              when={requests().length > 0}
              fallback={
                <div class="px-6 py-16 text-center">
                  <Icons.wallet class="mx-auto mb-3 h-11 w-11 text-muted" />
                  <p class="text-sm font-semibold text-foreground">No petty cash requests found</p>
                  <p class="mt-1 text-sm text-muted">
                    Create a request to start the approval flow.
                  </p>
                </div>
              }
            >
              <div class="divide-y divide-border md:hidden">
                <For each={requests()}>
                  {(request: PettyCashRequest) => (
                    <button
                      type="button"
                      onClick={() => navigate(`/petty-cash/${request.id}`)}
                      class="block w-full px-4 py-4 text-left transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="font-mono text-sm font-semibold text-foreground">
                            {request.requestNumber}
                          </p>
                          <p class="mt-0.5 text-xs text-muted">
                            {formatDatePH(request.requestDate)}
                          </p>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>
                      <p class="mt-3 line-clamp-2 text-sm text-foreground">{request.purpose}</p>
                      <div class="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p class="text-muted">Requester</p>
                          <p class="mt-0.5 truncate font-medium text-foreground">
                            {request.requestedByName || request.requestedByEmail}
                          </p>
                        </div>
                        <div class="text-right">
                          <p class="text-muted">Amount</p>
                          <p class="mt-0.5 font-semibold text-foreground">
                            {formatPeso(Number(request.amountApproved ?? request.amountRequested))}
                          </p>
                        </div>
                        <div class="col-span-2">
                          <p class="text-muted">Release</p>
                          <p class="mt-0.5 font-medium text-foreground">
                            {pettyCashReleaseMethodLabels[request.releaseMethod]}
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
                </For>
              </div>

              <div class="hidden md:block">
                <DataTable>
                  <THead>
                    <Th>Request</Th>
                    <Th>Requester</Th>
                    <Th>Purpose</Th>
                    <Th align="right">Amount</Th>
                    <Th>Release</Th>
                    <Th>Status</Th>
                    <Th align="right">Actions</Th>
                  </THead>
                  <tbody>
                    <For each={requests()}>
                      {(request: PettyCashRequest) => (
                        <tr
                          onClick={() => navigate(`/petty-cash/${request.id}`)}
                          class="cursor-pointer border-t border-border transition-colors hover:bg-surface-muted"
                        >
                          <td class="px-6 py-4">
                            <p class="font-mono text-sm font-semibold text-foreground">
                              {request.requestNumber}
                            </p>
                            <p class="text-xs text-muted">{formatDatePH(request.requestDate)}</p>
                          </td>
                          <td class="px-6 py-4">
                            <p class="text-sm text-foreground">{request.requestedByName}</p>
                            <p class="text-xs text-muted">{request.department}</p>
                          </td>
                          <td class="max-w-[360px] px-6 py-4">
                            <p class="truncate text-sm text-foreground">{request.purpose}</p>
                            <Show when={request.urgency}>
                              <p class="text-xs text-muted">{request.urgency}</p>
                            </Show>
                          </td>
                          <td class="px-6 py-4 text-right text-sm font-medium text-foreground">
                            {formatPeso(Number(request.amountApproved ?? request.amountRequested))}
                          </td>
                          <td class="px-6 py-4 text-sm text-muted">
                            {pettyCashReleaseMethodLabels[request.releaseMethod]}
                          </td>
                          <td class="px-6 py-4">
                            <StatusBadge status={request.status} />
                          </td>
                          <td class="px-6 py-4 text-right">
                            <span class="text-sm font-medium text-primary">Open</span>
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </DataTable>
              </div>
            </Show>
            <Show when={data.total > data.limit}>
              <div class="flex items-center justify-between border-t border-border px-5 py-3">
                <p class="text-xs text-muted">
                  Page {page()} of {pageCount()} · {data.total} requests
                </p>
                <div class="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={page() <= 1 || requestsQuery.isFetching}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={page() >= pageCount() || requestsQuery.isFetching}
                    onClick={() => setPage(p => Math.min(pageCount(), p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Show>
          </div>
        )}
      </QueryBoundary>

      <FundSetupModal
        open={fundOpen()}
        onClose={() => setFundOpen(false)}
        summary={summaryQuery.data}
      />
    </PageContainer>
  )
}
