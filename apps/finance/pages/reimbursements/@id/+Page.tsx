import { API_URL } from "@ark/api-client"
import type { Reimbursement, RrItem } from "@ark/data-types"
import {
  BackLink,
  formatDatePH,
  formatPeso,
  Icons,
  InfoCard,
  PageContainer,
  PageHeader,
  StatusBadge,
  THead,
  Th,
} from "@ark/ui"
import {
  useAccountingNoteRr,
  useApproveRr,
  useFinanceVerifyRr,
  useReimbursement,
  useRejectRr,
} from "@data/hooks"
import { createMemo, createSignal, For, Show } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"

type ActionMode = "verify" | "approve" | "reject" | "accounting" | null

export default function RrDetailPage() {
  const ctx = usePageContext()
  const id = createMemo(() => ctx.routeParams.id as string)
  const query = useReimbursement(id)

  const verify = useFinanceVerifyRr()
  const approve = useApproveRr()
  const reject = useRejectRr()
  const accounting = useAccountingNoteRr()

  const [mode, setMode] = createSignal<ActionMode>(null)
  const [notes, setNotes] = createSignal("")
  const [showError, setShowError] = createSignal(false)

  const processing = () =>
    verify.isPending || approve.isPending || reject.isPending || accounting.isPending

  const startAction = (m: Exclude<ActionMode, null>) => {
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
          return (
            <>
              <PageHeader
                title={rr.rrCode}
                badge={<StatusBadge status={rr.status} />}
                subtitle={rr.claimantName ?? rr.createdBy ?? ""}
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
                      <Icons.fileText class="w-4 h-4" /> View PDF
                    </a>
                  </div>
                }
              />

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <InfoCard label="Claimant" value={rr.claimantName ?? rr.createdBy ?? "—"} />
                <InfoCard label="Position" value={rr.claimantPosition ?? "—"} />
                <InfoCard label="Department" value={rr.claimantDepartment ?? "—"} />
                <InfoCard label="Total Claimed" value={formatPeso(Number(rr.totalAmount))} />
                <InfoCard
                  label="Date Filed"
                  value={rr.dateFiled ? formatDatePH(rr.dateFiled) : "—"}
                />
                <InfoCard
                  label="Period"
                  value={
                    rr.periodStart || rr.periodEnd
                      ? `${rr.periodStart ? formatDatePH(rr.periodStart) : "—"} → ${
                          rr.periodEnd ? formatDatePH(rr.periodEnd) : "—"
                        }`
                      : "—"
                  }
                />
                <InfoCard label="Activity" value={rr.activity ?? "—"} />
                <InfoCard label="Referenced PR" value={rr.referencedPrCode ?? "—"} mono />
              </div>

              <Show
                when={
                  rr.expenseCategory || rr.profitCenter || rr.accountingTreatment || rr.costType
                }
              >
                <div class="bg-surface rounded-lg border border-border mb-8">
                  <div class="px-6 py-4 border-b border-border">
                    <h2 class="text-lg font-semibold text-foreground">Accounting Classification</h2>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-border">
                    <Cell label="Expense Category" value={rr.expenseCategory ?? "—"} />
                    <Cell label="Profit Center" value={rr.profitCenter ?? "—"} />
                    <Cell label="Accounting Treatment" value={rr.accountingTreatment ?? "—"} />
                    <Cell label="Cost Type" value={rr.costType ?? "—"} />
                  </div>
                </div>
              </Show>

              <div class="bg-surface rounded-lg border border-border mb-8">
                <div class="px-6 py-4 border-b border-border">
                  <h2 class="text-lg font-semibold text-foreground">
                    Expense Items ({items.length})
                  </h2>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <THead>
                      <Th size="dense">#</Th>
                      <Th size="dense">Date</Th>
                      <Th size="dense">Description</Th>
                      <Th size="dense">Receipt #</Th>
                      <Th size="dense" align="right">
                        Amount
                      </Th>
                      <Th size="dense">OR?</Th>
                    </THead>
                    <tbody>
                      <For each={items}>
                        {(it, i) => (
                          <tr class="border-t border-border">
                            <td class="py-3 px-6 text-sm text-foreground">{i() + 1}</td>
                            <td class="py-3 px-6 text-sm text-muted">
                              {it.date ? formatDatePH(it.date) : "—"}
                            </td>
                            <td class="py-3 px-6 text-sm text-foreground">{it.description}</td>
                            <td class="py-3 px-6 text-sm text-muted">{it.receiptNo ?? "—"}</td>
                            <td class="py-3 px-6 text-sm text-foreground text-right">
                              {formatPeso(it.amount)}
                            </td>
                            <td class="py-3 px-6 text-sm text-muted">
                              {it.hasReceipt ? "Yes" : "No"}
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                    <tfoot class="border-t border-border">
                      <tr>
                        <td
                          colSpan={4}
                          class="py-3 px-6 text-right text-sm font-medium text-foreground"
                        >
                          Grand Total
                        </td>
                        <td class="py-3 px-6 text-right text-base text-foreground">
                          {formatPeso(Number(rr.totalAmount))}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <Show when={rr.amountInWords}>
                  <div class="px-6 py-3 border-t border-border text-xs text-muted">
                    In words: <span class="text-foreground">{rr.amountInWords}</span>
                  </div>
                </Show>
              </div>

              <Show when={rr.supportingDocs} keyed>
                {docs => (
                  <div class="bg-surface rounded-lg border border-border mb-8">
                    <div class="px-6 py-4 border-b border-border">
                      <h2 class="text-lg font-semibold text-foreground">Supporting Documents</h2>
                    </div>
                    <div class="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <DocLine checked={!!docs.receipts} label="Official Receipts / Invoice" />
                      <DocLine
                        checked={!!docs.prRef}
                        label={
                          rr.referencedPrCode
                            ? `Approved PR (${rr.referencedPrCode})`
                            : "Approved Purchase Request"
                        }
                      />
                      <DocLine checked={!!docs.deliveryReceipt} label="Signed Delivery Receipt" />
                      <DocLine checked={!!docs.activity} label="Activity Report / Attendance" />
                      <DocLine checked={!!docs.quotation} label="Quotation / Canvass Sheet" />
                      <Show when={docs.other}>
                        <DocLine checked={true} label={`Other: ${docs.other}`} />
                      </Show>
                    </div>
                    <Show when={docs.noReceiptsExplanation}>
                      <div class="px-6 py-3 border-t border-border text-xs text-muted">
                        No receipts —{" "}
                        <span class="text-foreground">{docs.noReceiptsExplanation}</span>
                      </div>
                    </Show>
                  </div>
                )}
              </Show>

              <Show
                when={
                  rr.financeVerifiedBy ||
                  rr.financeVerifiedAt ||
                  rr.approvedBy ||
                  rr.approvedAt ||
                  rr.accountingNotedBy
                }
              >
                <div class="bg-surface rounded-lg border border-border mb-8">
                  <div class="px-6 py-4 border-b border-border">
                    <h2 class="text-lg font-semibold text-foreground">Audit Trail</h2>
                  </div>
                  <div class="divide-y divide-border">
                    <Show when={rr.financeVerifiedBy || rr.financeVerifiedAt}>
                      <AuditRow
                        stage="Finance verified"
                        who={rr.financeVerifiedBy}
                        when={rr.financeVerifiedAt}
                        notes={rr.financeVerifyNotes}
                      />
                    </Show>
                    <Show when={rr.approvedBy || rr.approvedAt}>
                      <AuditRow
                        stage={rr.status === "rejected" ? "Rejected by" : "Approved by"}
                        who={rr.approvedBy}
                        when={rr.approvedAt}
                        notes={rr.approvalNotes}
                      />
                    </Show>
                    <Show when={rr.accountingNotedBy || rr.accountingNotedAt}>
                      <AuditRow
                        stage="Accounting recorded"
                        who={rr.accountingNotedBy}
                        when={rr.accountingNotedAt}
                        notes={rr.accountingNotes}
                      />
                    </Show>
                  </div>
                </div>
              </Show>

              <div class="bg-surface rounded-lg border border-border p-6">
                <h2 class="text-lg font-semibold text-foreground mb-4">Actions</h2>
                <Show
                  when={mode() !== null}
                  fallback={
                    <div class="flex flex-wrap gap-2">
                      <Show when={rr.status === "pending"}>
                        <button
                          type="button"
                          onClick={() => startAction("verify")}
                          class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg"
                        >
                          Verify (Finance)
                        </button>
                      </Show>
                      <Show when={rr.status === "verified"}>
                        <button
                          type="button"
                          onClick={() => startAction("approve")}
                          class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg"
                        >
                          Approve (Management)
                        </button>
                      </Show>
                      <Show when={rr.status === "pending" || rr.status === "verified"}>
                        <button
                          type="button"
                          onClick={() => startAction("reject")}
                          class="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-lg"
                        >
                          Reject
                        </button>
                      </Show>
                      <Show when={rr.status === "approved" && !rr.accountingNotedBy}>
                        <button
                          type="button"
                          onClick={() => startAction("accounting")}
                          class="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border hover:bg-surface-muted rounded-lg"
                        >
                          Stamp for Accounting
                        </button>
                      </Show>
                      <Show
                        when={
                          rr.status === "rejected" ||
                          (rr.status === "approved" && rr.accountingNotedBy)
                        }
                      >
                        <p class="text-sm text-muted">No further actions for {rr.status} claims.</p>
                      </Show>
                    </div>
                  }
                >
                  <div>
                    <label for="rr-notes" class="block text-sm font-medium text-foreground mb-2">
                      {mode() === "reject"
                        ? "Reason for rejection"
                        : mode() === "verify"
                          ? "Verification notes (optional)"
                          : mode() === "approve"
                            ? "Approval notes (optional)"
                            : "Accounting notes (optional)"}
                      <Show when={mode() === "reject"}>
                        <span class="text-red-500 ml-0.5">*</span>
                      </Show>
                    </label>
                    <textarea
                      id="rr-notes"
                      value={notes()}
                      onInput={e => {
                        setNotes(e.currentTarget.value)
                        if (showError()) setShowError(false)
                      }}
                      rows={3}
                      placeholder={
                        mode() === "reject"
                          ? "Tell the claimant why so they can fix and resubmit..."
                          : "Add a note (optional)..."
                      }
                      class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${showError() ? "border-red-300 focus:ring-red-200" : "border-border focus:ring-primary/20 focus:border-primary"}`}
                    />
                    <Show when={showError()}>
                      <p class="text-xs text-red-600 mt-1">A reason is required to reject.</p>
                    </Show>
                    <div class="flex justify-end gap-3 mt-4">
                      <button
                        type="button"
                        onClick={cancelAction}
                        disabled={processing()}
                        class="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={submitAction}
                        disabled={processing()}
                        class={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${mode() === "reject" ? "bg-accent hover:bg-accent/90" : "bg-primary hover:bg-primary/90"}`}
                      >
                        {processing() ? "Submitting..." : "Confirm"}
                      </button>
                    </div>
                  </div>
                </Show>
              </div>
            </>
          )
        }}
      </Show>
    </PageContainer>
  )
}

function Cell(props: { label: string; value: string }) {
  return (
    <div class="px-6 py-4">
      <p class="text-xs text-muted mb-1">{props.label}</p>
      <p class="text-sm font-medium text-foreground">{props.value}</p>
    </div>
  )
}

function AuditRow(props: {
  stage: string
  who: string | null | undefined
  when: string | null | undefined
  notes: string | null | undefined
}) {
  return (
    <div class="flex flex-col sm:flex-row sm:items-center sm:gap-6 py-4 px-6">
      <span class="w-48 text-sm text-muted">{props.stage}</span>
      <span class="text-sm text-foreground">
        {props.who ?? "—"}{" "}
        <Show when={props.when}>
          <span class="text-muted">· {formatDatePH(props.when ?? "")}</span>
        </Show>
      </span>
      <Show when={props.notes}>
        <span class="text-sm text-muted sm:ml-auto sm:max-w-md">"{props.notes}"</span>
      </Show>
    </div>
  )
}

function DocLine(props: { checked: boolean; label: string }) {
  return (
    <span
      class={`inline-flex items-start gap-2 ${props.checked ? "text-foreground" : "text-muted"}`}
    >
      <span class="mt-0.5">{props.checked ? "☑" : "☐"}</span>
      <span>{props.label}</span>
    </span>
  )
}
