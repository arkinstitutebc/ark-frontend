import { useCurrentUser } from "@ark/api-client"
import {
  AttachmentUploader,
  BackLink,
  Button,
  formatDatePH,
  formatPeso,
  InfoCard,
  PageContainer,
  PageHeader,
  Select,
} from "@ark/ui"
import {
  useApprovePettyCash,
  useClosePettyCash,
  usePettyCashRequest,
  useRejectPettyCash,
  useReleasePettyCash,
  useSubmitPettyCashLiquidation,
} from "@data/hooks"
import { pettyCashLiquidationSchema } from "@data/schemas"
import type {
  PettyCashAttachmentInput,
  PettyCashReleaseMethod,
  PettyCashRequest,
} from "@data/types"
import { validateForm } from "@data/validate"
import { createMemo, createSignal, Show } from "solid-js"
import { navigate } from "vike/client/router"
import { usePageContext } from "vike-solid/usePageContext"
import {
  groupPettyCashAttachments,
  PettyCashAttachmentList,
  pettyCashAmount,
  pettyCashReleaseMethodLabels,
  pettyCashReleaseMethodOptions,
} from "@/components/petty-cash"
import { QueryBoundary, StatusBadge } from "@/components/ui"

function AdminActionPanel(props: { request: PettyCashRequest }) {
  const approve = useApprovePettyCash()
  const reject = useRejectPettyCash()
  const release = useReleasePettyCash()
  const close = useClosePettyCash()
  const [approvedAmount, setApprovedAmount] = createSignal(String(props.request.amountRequested))
  const [approvalNotes, setApprovalNotes] = createSignal("")
  const [rejectionReason, setRejectionReason] = createSignal("")
  const [releaseMethod, setReleaseMethod] = createSignal<PettyCashReleaseMethod>(
    props.request.releaseMethod
  )
  const [releaseDate, setReleaseDate] = createSignal(new Date().toISOString().slice(0, 10))
  const [closeNotes, setCloseNotes] = createSignal("")

  return (
    <aside class="space-y-4">
      <section class="rounded-lg border border-border bg-surface p-5">
        <h2 class="text-base font-semibold text-foreground">Admin Actions</h2>
        <Show when={props.request.status === "pending"}>
          <div class="mt-4 space-y-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-foreground" for="pc-approved">
                Approved Amount
              </label>
              <input
                id="pc-approved"
                type="number"
                min="0"
                step="0.01"
                value={approvedAmount()}
                onInput={e => setApprovedAmount(e.currentTarget.value)}
                class="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-foreground" for="pc-approval-notes">
                Approval Notes
              </label>
              <textarea
                id="pc-approval-notes"
                rows={3}
                value={approvalNotes()}
                onInput={e => setApprovalNotes(e.currentTarget.value)}
                class="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div class="flex gap-2">
              <Button
                type="button"
                size="sm"
                class="flex-1"
                loading={approve.isPending}
                loadingLabel="Approving..."
                onClick={() =>
                  approve.mutate({
                    id: props.request.id,
                    amountApproved: Number(approvedAmount() || 0).toFixed(2),
                    notes: approvalNotes().trim() || undefined,
                  })
                }
              >
                Approve
              </Button>
            </div>
            <div class="border-t border-border pt-3">
              <label class="mb-1 block text-sm font-medium text-foreground" for="pc-reject">
                Rejection Reason
              </label>
              <textarea
                id="pc-reject"
                rows={3}
                value={rejectionReason()}
                onInput={e => setRejectionReason(e.currentTarget.value)}
                class="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                class="mt-2 w-full"
                loading={reject.isPending}
                loadingLabel="Rejecting..."
                disabled={!rejectionReason().trim()}
                onClick={() =>
                  reject.mutate({ id: props.request.id, rejectionReason: rejectionReason().trim() })
                }
              >
                Reject
              </Button>
            </div>
          </div>
        </Show>

        <Show when={props.request.status === "approved"}>
          <div class="mt-4 space-y-3">
            <div>
              <span class="mb-1 block text-sm font-medium text-foreground">Release Method</span>
              <Select
                options={pettyCashReleaseMethodOptions}
                value={releaseMethod()}
                onChange={value => setReleaseMethod(value as PettyCashReleaseMethod)}
                ariaLabel="Release method"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-foreground" for="pc-release-date">
                Release Date
              </label>
              <input
                id="pc-release-date"
                type="date"
                value={releaseDate()}
                onInput={e => setReleaseDate(e.currentTarget.value)}
                class="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button
              type="button"
              size="sm"
              class="w-full"
              loading={release.isPending}
              loadingLabel="Releasing..."
              onClick={() =>
                release.mutate({
                  id: props.request.id,
                  releaseMethod: releaseMethod(),
                  releasedAt: releaseDate(),
                })
              }
            >
              Mark as Released
            </Button>
          </div>
        </Show>

        <Show when={props.request.status === "liquidated"}>
          <div class="mt-4 space-y-3">
            <textarea
              rows={3}
              value={closeNotes()}
              onInput={e => setCloseNotes(e.currentTarget.value)}
              placeholder="Closing notes"
              class="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button
              type="button"
              size="sm"
              class="w-full"
              loading={close.isPending}
              loadingLabel="Closing..."
              onClick={() =>
                close.mutate({ id: props.request.id, notes: closeNotes().trim() || undefined })
              }
            >
              Close Request
            </Button>
          </div>
        </Show>

        <Show when={!["pending", "approved", "liquidated"].includes(props.request.status)}>
          <p class="mt-4 text-sm text-muted">No admin action is available for this status.</p>
        </Show>
      </section>
    </aside>
  )
}

function LiquidationPanel(props: { request: PettyCashRequest }) {
  const submit = useSubmitPettyCashLiquidation()
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [actualAmountUsed, setActualAmountUsed] = createSignal("")
  const [remarks, setRemarks] = createSignal("")
  const [receipts, setReceipts] = createSignal<PettyCashAttachmentInput[]>([])
  const [forms, setForms] = createSignal<PettyCashAttachmentInput[]>([])

  const releasedAmount = createMemo(() => pettyCashAmount(props.request))
  const variance = createMemo(() => releasedAmount() - Number(actualAmountUsed() || 0))

  const handleSubmit = (event: Event) => {
    event.preventDefault()
    const result = validateForm(pettyCashLiquidationSchema, {
      actualAmountUsed: Number(actualAmountUsed()),
    })
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    submit.mutate({
      id: props.request.id,
      actualAmountUsed: Number(actualAmountUsed() || 0).toFixed(2),
      remarks: remarks().trim() || undefined,
      receipts: receipts().length ? receipts() : undefined,
      liquidationForms: forms().length ? forms() : undefined,
    })
  }

  return (
    <section class="rounded-lg border border-border bg-surface p-5">
      <h2 class="text-base font-semibold text-foreground">Submit Liquidation</h2>
      <form onSubmit={handleSubmit} class="mt-4 space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium text-foreground" for="pc-actual-used">
            Actual Amount Used
          </label>
          <input
            id="pc-actual-used"
            type="number"
            min="0"
            step="0.01"
            value={actualAmountUsed()}
            onInput={e => setActualAmountUsed(e.currentTarget.value)}
            class={`w-full rounded-lg border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              errors().actualAmountUsed ? "border-red-300" : "border-border"
            }`}
          />
          <Show when={errors().actualAmountUsed}>
            <p class="mt-1 text-xs text-red-600">{errors().actualAmountUsed}</p>
          </Show>
        </div>
        <div class="rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm">
          <div class="flex justify-between gap-4">
            <span class="text-muted">Released</span>
            <span class="font-medium text-foreground">{formatPeso(releasedAmount())}</span>
          </div>
          <div class="mt-1 flex justify-between gap-4">
            <span class="text-muted">{variance() >= 0 ? "Excess to return" : "Shortage"}</span>
            <span class="font-medium text-foreground">{formatPeso(Math.abs(variance()))}</span>
          </div>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-foreground" for="pc-remarks">
            Remarks
          </label>
          <textarea
            id="pc-remarks"
            rows={3}
            value={remarks()}
            onInput={e => setRemarks(e.currentTarget.value)}
            class="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <p class="mb-2 text-sm font-medium text-foreground">Receipts</p>
          <AttachmentUploader
            attachments={receipts()}
            onChange={next => setReceipts(next)}
            signatureEndpoint="/api/procurement/upload-signature/attachment"
          />
        </div>
        <div>
          <p class="mb-2 text-sm font-medium text-foreground">Liquidation Form</p>
          <AttachmentUploader
            attachments={forms()}
            onChange={next => setForms(next)}
            signatureEndpoint="/api/procurement/upload-signature/attachment"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          class="w-full"
          loading={submit.isPending}
          loadingLabel="Submitting..."
        >
          Submit Liquidation
        </Button>
      </form>
    </section>
  )
}

export default function PettyCashDetailPage() {
  const pageContext = usePageContext()
  const id = createMemo(() => pageContext.routeParams.id as string)
  const query = usePettyCashRequest(id)
  const userQuery = useCurrentUser()
  const isAdmin = createMemo(() => userQuery.data?.role === "admin")

  return (
    <PageContainer>
      <div class="mb-6">
        <BackLink href="/petty-cash">Back to Petty Cash</BackLink>
      </div>

      <QueryBoundary query={query}>
        {(request: PettyCashRequest) => {
          const groups = groupPettyCashAttachments(request.attachments)
          return (
            <>
              <PageHeader
                title={request.requestNumber}
                subtitle={request.purpose}
                badge={<StatusBadge status={request.status} />}
                action={
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate("/petty-cash/new")}
                  >
                    New Request
                  </Button>
                }
              />

              <div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <InfoCard label="Requested" value={formatPeso(Number(request.amountRequested))} />
                <InfoCard label="Approved" value={formatPeso(pettyCashAmount(request))} />
                <InfoCard label="Request Date" value={formatDatePH(request.requestDate)} />
                <InfoCard
                  label="Release Mode"
                  value={pettyCashReleaseMethodLabels[request.releaseMethod]}
                />
              </div>

              <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div class="space-y-6">
                  <section class="rounded-lg border border-border bg-surface">
                    <div class="border-b border-border px-5 py-4">
                      <h2 class="text-base font-semibold text-foreground">Request Details</h2>
                    </div>
                    <div class="divide-y divide-border">
                      <div class="grid gap-2 px-5 py-4 sm:grid-cols-[180px_1fr]">
                        <span class="text-sm text-muted">Requested By</span>
                        <span class="text-sm text-foreground">
                          {request.requestedByName || request.requestedByEmail}
                        </span>
                      </div>
                      <div class="grid gap-2 px-5 py-4 sm:grid-cols-[180px_1fr]">
                        <span class="text-sm text-muted">Department</span>
                        <span class="text-sm text-foreground">{request.department}</span>
                      </div>
                      <div class="grid gap-2 px-5 py-4 sm:grid-cols-[180px_1fr]">
                        <span class="text-sm text-muted">Purpose</span>
                        <span class="text-sm text-foreground">{request.purpose}</span>
                      </div>
                      <Show when={request.urgency}>
                        <div class="grid gap-2 px-5 py-4 sm:grid-cols-[180px_1fr]">
                          <span class="text-sm text-muted">Urgency</span>
                          <span class="text-sm text-foreground">{request.urgency}</span>
                        </div>
                      </Show>
                      <Show when={request.notes}>
                        <div class="grid gap-2 px-5 py-4 sm:grid-cols-[180px_1fr]">
                          <span class="text-sm text-muted">Notes</span>
                          <span class="text-sm text-foreground">{request.notes}</span>
                        </div>
                      </Show>
                    </div>
                  </section>

                  <Show when={request.liquidation}>
                    {liquidation => (
                      <section class="rounded-lg border border-border bg-surface">
                        <div class="border-b border-border px-5 py-4">
                          <h2 class="text-base font-semibold text-foreground">Liquidation</h2>
                        </div>
                        <div class="grid gap-4 p-5 sm:grid-cols-3">
                          <InfoCard
                            label="Actual Used"
                            value={formatPeso(Number(liquidation().actualAmountUsed))}
                          />
                          <InfoCard
                            label="Returned"
                            value={formatPeso(Number(liquidation().returnAmount))}
                          />
                          <InfoCard
                            label="Shortage"
                            value={formatPeso(Number(liquidation().shortageAmount))}
                          />
                        </div>
                      </section>
                    )}
                  </Show>

                  <PettyCashAttachmentList
                    title="Supporting Documents"
                    attachments={groups.supporting}
                  />
                  <PettyCashAttachmentList title="Receipts" attachments={groups.receipts} />
                  <PettyCashAttachmentList title="Liquidation Forms" attachments={groups.forms} />
                </div>

                <div class="space-y-4">
                  <Show when={isAdmin()}>
                    <AdminActionPanel request={request} />
                  </Show>
                  <Show when={!isAdmin() && request.status === "released"}>
                    <LiquidationPanel request={request} />
                  </Show>
                  <Show when={isAdmin() && request.status === "released"}>
                    <div class="rounded-lg border border-border bg-surface p-5">
                      <p class="text-sm font-medium text-foreground">Waiting for liquidation</p>
                      <p class="mt-1 text-sm text-muted">
                        The requester can upload receipts and the liquidation form from their
                        account.
                      </p>
                    </div>
                  </Show>
                </div>
              </div>
            </>
          )
        }}
      </QueryBoundary>
    </PageContainer>
  )
}
