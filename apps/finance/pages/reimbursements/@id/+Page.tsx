import { API_URL } from "@ark/api-client"
import type { PrAttachment, Reimbursement, RrItem } from "@ark/data-types"
import { BackLink, Icons, PageContainer, PageHeader, StatusBadge } from "@ark/ui"
import {
  useAccountingNoteRr,
  useApproveRr,
  useFinanceVerifyRr,
  useReimbursement,
  useRejectRr,
} from "@data/hooks"
import { createMemo, createSignal, Show } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"
import {
  ReimbursementAccountingCard,
  ReimbursementActionPanel,
  ReimbursementAttachmentsCard,
  ReimbursementAuditTrail,
  ReimbursementHeaderSubtitle,
  ReimbursementItemsCard,
  ReimbursementOverviewCard,
  ReimbursementSupportingDocsCard,
  type RrActionMode,
} from "@/components/finance/reimbursement-detail-sections"

export default function RrDetailPage() {
  const ctx = usePageContext()
  const id = createMemo(() => ctx.routeParams.id as string)
  const query = useReimbursement(id)

  const verify = useFinanceVerifyRr()
  const approve = useApproveRr()
  const reject = useRejectRr()
  const accounting = useAccountingNoteRr()

  const [mode, setMode] = createSignal<RrActionMode>(null)
  const [notes, setNotes] = createSignal("")
  const [showError, setShowError] = createSignal(false)

  const processing = () =>
    verify.isPending || approve.isPending || reject.isPending || accounting.isPending

  const startAction = (m: Exclude<RrActionMode, null>) => {
    setMode(m)
    setNotes("")
    setShowError(false)
  }
  const cancelAction = () => {
    setMode(null)
    setNotes("")
    setShowError(false)
  }
  const submitAction = () => {
    const m = mode()
    if (!m) return
    const trimmed = notes().trim()
    if (m === "reject" && !trimmed) {
      setShowError(true)
      return
    }
    const onDone = () => cancelAction()
    if (m === "verify")
      verify.mutate({ id: id(), notes: trimmed || undefined }, { onSuccess: onDone })
    if (m === "approve")
      approve.mutate({ id: id(), approvalNotes: trimmed || undefined }, { onSuccess: onDone })
    if (m === "reject") reject.mutate({ id: id(), approvalNotes: trimmed }, { onSuccess: onDone })
    if (m === "accounting")
      accounting.mutate({ id: id(), notes: trimmed || undefined }, { onSuccess: onDone })
  }

  return (
    <PageContainer>
      <div class="mb-6">
        <BackLink href="/reimbursements">Back to claims</BackLink>
      </div>

      <Show
        when={query.data}
        keyed
        fallback={
          <div class="py-16 text-center text-sm text-muted">
            <Show when={query.isPending}>Loading…</Show>
            <Show when={query.isError}>Could not load this reimbursement.</Show>
          </div>
        }
      >
        {rrData => {
          const rr = rrData as Reimbursement
          const items = (rr.items ?? []) as RrItem[]
          const attachments = (rr.attachments ?? []) as PrAttachment[]
          return (
            <>
              <PageHeader
                title={rr.rrCode}
                badge={<StatusBadge status={rr.status} />}
                subtitle={<ReimbursementHeaderSubtitle rr={rr} />}
                action={
                  <div class="flex items-center gap-2">
                    <Show when={rr.status === "pending"}>
                      <a
                        href={`/reimbursements/${rr.id}/edit`}
                        class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted"
                      >
                        <Icons.edit class="w-4 h-4" /> Edit
                      </a>
                    </Show>
                    <a
                      href={`${API_URL}/api/reimbursements/${rr.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted"
                    >
                      <Icons.fileText class="w-4 h-4" /> PDF
                    </a>
                  </div>
                }
              />

              <ReimbursementOverviewCard rr={rr} />
              <ReimbursementAccountingCard rr={rr} />
              <ReimbursementItemsCard
                items={items}
                totalAmount={rr.totalAmount}
                amountInWords={rr.amountInWords}
              />
              <ReimbursementSupportingDocsCard rr={rr} />
              <ReimbursementAttachmentsCard attachments={attachments} />
              <ReimbursementAuditTrail rr={rr} />
              <ReimbursementActionPanel
                status={rr.status}
                accountingNotedBy={rr.accountingNotedBy}
                mode={mode()}
                notes={notes()}
                showError={showError()}
                processing={processing()}
                onMode={startAction}
                onNotes={setNotes}
                onClearError={() => setShowError(false)}
                onCancel={cancelAction}
                onSubmit={submitAction}
              />
            </>
          )
        }}
      </Show>
    </PageContainer>
  )
}
