import type { PrAttachment, Reimbursement, RrItem, RrStatus } from "@ark/data-types"
import {
  Button,
  formatAccountingTreatment,
  formatCostType,
  formatDatePH,
  formatExpenseCategory,
  formatPeso,
  Icons,
  Textarea,
  THead,
  Th,
} from "@ark/ui"
import type { JSX } from "solid-js"
import { For, Show } from "solid-js"

export type RrActionMode = "verify" | "approve" | "reject" | "accounting" | null

export function ReimbursementHeaderSubtitle(props: { rr: Reimbursement }) {
  return (
    <span>
      {props.rr.claimantName ?? props.rr.createdBy ?? "Unassigned claimant"}
      <Show when={props.rr.dateFiled}>
        <span> · Filed {formatDatePH(props.rr.dateFiled ?? "")}</span>
      </Show>
    </span>
  )
}

export function ReimbursementOverviewCard(props: { rr: Reimbursement }) {
  const rr = () => props.rr
  const period = () => {
    if (!rr().periodStart && !rr().periodEnd) return "—"
    return `${rr().periodStart ? formatDatePH(rr().periodStart ?? "") : "—"} to ${
      rr().periodEnd ? formatDatePH(rr().periodEnd ?? "") : "—"
    }`
  }

  return (
    <div class="mb-8 rounded-lg border border-border bg-surface p-6">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">Claimant</p>
          <h2 class="mt-1 truncate text-xl font-semibold text-foreground">
            {rr().claimantName ?? rr().createdBy ?? "—"}
          </h2>
          <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <span>{rr().claimantPosition ?? "No role recorded"}</span>
            <span>{rr().claimantDepartment ?? "No department recorded"}</span>
          </div>
          <Show when={rr().activity || rr().schoolPartner}>
            <p class="mt-4 max-w-3xl text-sm text-muted">
              <span class="font-medium text-foreground">{rr().activity ?? "No activity"}</span>
              <Show when={rr().schoolPartner}>
                <span> · {rr().schoolPartner}</span>
              </Show>
            </p>
          </Show>
        </div>

        <div class="rounded-lg border border-primary/20 bg-primary/5 px-5 py-4 text-right">
          <p class="text-xs font-semibold uppercase tracking-wide text-primary">Total claimed</p>
          <p class="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {formatPeso(Number(rr().totalAmount))}
          </p>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewMetric
          label="Date filed"
          value={rr().dateFiled ? formatDatePH(rr().dateFiled ?? "") : "—"}
        />
        <OverviewMetric label="Claim period" value={period()} />
        <OverviewMetric label="Referenced PR" value={rr().referencedPrCode ?? "—"} mono />
        <OverviewMetric label="Recorded by" value={rr().createdBy ?? "—"} />
      </div>
    </div>
  )
}

export function ReimbursementAccountingCard(props: { rr: Reimbursement }) {
  const rr = () => props.rr

  return (
    <Show
      when={rr().expenseCategory || rr().profitCenter || rr().accountingTreatment || rr().costType}
    >
      <SectionCard title="Accounting Classification">
        <div class="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          <DetailCell
            label="Expense Category"
            value={formatExpenseCategory(rr().expenseCategory)}
          />
          <DetailCell label="Profit Center" value={rr().profitCenter ?? "—"} />
          <DetailCell
            label="Accounting Treatment"
            value={formatAccountingTreatment(rr().accountingTreatment)}
          />
          <DetailCell label="Cost Type" value={formatCostType(rr().costType)} />
        </div>
      </SectionCard>
    </Show>
  )
}

export function ReimbursementItemsCard(props: {
  items: RrItem[]
  totalAmount: string | number
  amountInWords?: string | null
}) {
  return (
    <SectionCard title={`Expense Items (${props.items.length})`}>
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
            <For each={props.items}>
              {(item, index) => (
                <tr class="border-t border-border align-top">
                  <td class="py-3 px-6 text-sm text-muted tabular-nums">{index() + 1}</td>
                  <td class="py-3 px-6 text-sm text-muted whitespace-nowrap">
                    {item.date ? formatDatePH(item.date) : "—"}
                  </td>
                  <td class="py-3 px-6 text-sm font-medium text-foreground">
                    {item.description || "—"}
                  </td>
                  <td class="py-3 px-6 text-sm text-muted whitespace-nowrap">
                    {item.receiptNo ?? "—"}
                  </td>
                  <td class="py-3 px-6 text-right text-sm text-foreground tabular-nums">
                    {formatPeso(item.amount)}
                  </td>
                  <td class="py-3 px-6 text-sm text-muted">
                    <ReceiptPill hasReceipt={!!item.hasReceipt} />
                  </td>
                </tr>
              )}
            </For>
          </tbody>
          <tfoot class="border-t border-border">
            <tr>
              <td colSpan={4} class="py-3 px-6 text-right text-sm font-medium text-foreground">
                Grand Total
              </td>
              <td class="py-3 px-6 text-right text-base font-semibold text-foreground tabular-nums">
                {formatPeso(Number(props.totalAmount))}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <Show when={props.amountInWords}>
        <div class="border-t border-border px-6 py-3 text-xs text-muted">
          In words: <span class="text-foreground">{props.amountInWords}</span>
        </div>
      </Show>
    </SectionCard>
  )
}

export function ReimbursementSupportingDocsCard(props: { rr: Reimbursement }) {
  return (
    <Show when={props.rr.supportingDocs} keyed>
      {docs => (
        <SectionCard title="Supporting Documents">
          <div class="grid grid-cols-1 gap-2 px-6 py-4 text-sm sm:grid-cols-2">
            <DocLine checked={!!docs.receipts} label="Official Receipts / Invoice" />
            <DocLine
              checked={!!docs.prRef}
              label={
                props.rr.referencedPrCode
                  ? `Approved PR (${props.rr.referencedPrCode})`
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
            <div class="border-t border-border px-6 py-3 text-xs text-muted">
              No receipts: <span class="text-foreground">{docs.noReceiptsExplanation}</span>
            </div>
          </Show>
        </SectionCard>
      )}
    </Show>
  )
}

export function ReimbursementAttachmentsCard(props: { attachments: PrAttachment[] }) {
  return (
    <Show when={props.attachments.length > 0}>
      <SectionCard title={`Attachments (${props.attachments.length})`}>
        <ul class="space-y-2 px-6 py-4">
          <For each={props.attachments}>
            {attachment => (
              <li class="flex items-center gap-3 rounded-lg border border-border bg-surface-muted px-3 py-2">
                <Icons.fileText class="h-4 w-4 flex-shrink-0 text-muted" />
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="min-w-0 flex-1 truncate text-sm font-medium text-foreground hover:text-primary"
                  title={attachment.name}
                >
                  {attachment.name}
                </a>
                <Show when={attachment.size}>
                  <span class="text-xs text-muted">{formatBytes(attachment.size ?? 0)}</span>
                </Show>
                <Icons.download class="h-4 w-4 flex-shrink-0 text-muted" />
              </li>
            )}
          </For>
        </ul>
      </SectionCard>
    </Show>
  )
}

export function ReimbursementAuditTrail(props: { rr: Reimbursement }) {
  const rr = () => props.rr

  return (
    <Show
      when={
        rr().financeVerifiedBy ||
        rr().financeVerifiedAt ||
        rr().approvedBy ||
        rr().approvedAt ||
        rr().accountingNotedBy ||
        rr().accountingNotedAt
      }
    >
      <SectionCard title="Audit Trail">
        <div class="divide-y divide-border">
          <Show when={rr().financeVerifiedBy || rr().financeVerifiedAt}>
            <AuditRow
              stage="Finance verified"
              who={rr().financeVerifiedBy}
              when={rr().financeVerifiedAt}
              notes={rr().financeVerifyNotes}
            />
          </Show>
          <Show when={rr().approvedBy || rr().approvedAt}>
            <AuditRow
              stage={rr().status === "rejected" ? "Rejected by" : "Approved by"}
              who={rr().approvedBy}
              when={rr().approvedAt}
              notes={rr().approvalNotes}
            />
          </Show>
          <Show when={rr().accountingNotedBy || rr().accountingNotedAt}>
            <AuditRow
              stage="Accounting recorded"
              who={rr().accountingNotedBy}
              when={rr().accountingNotedAt}
              notes={rr().accountingNotes}
            />
          </Show>
        </div>
      </SectionCard>
    </Show>
  )
}

export function ReimbursementActionPanel(props: {
  status: RrStatus
  accountingNotedBy?: string | null
  mode: RrActionMode
  notes: string
  showError: boolean
  processing: boolean
  onMode: (mode: Exclude<RrActionMode, null>) => void
  onNotes: (value: string) => void
  onClearError: () => void
  onCancel: () => void
  onSubmit: () => void
}) {
  const label = () => {
    if (props.mode === "reject") return "Reason for rejection"
    if (props.mode === "verify") return "Verification notes"
    if (props.mode === "approve") return "Approval notes"
    return "Accounting notes"
  }

  return (
    <SectionCard title="Actions" class="mb-0">
      <div class="p-6">
        <Show
          when={props.mode !== null}
          fallback={
            <div class="flex flex-wrap items-center gap-2">
              <Show when={props.status === "pending"}>
                <Button type="button" size="sm" onClick={() => props.onMode("verify")}>
                  <Icons.checkCircle class="h-4 w-4" />
                  Verify Finance
                </Button>
              </Show>
              <Show when={props.status === "verified"}>
                <Button type="button" size="sm" onClick={() => props.onMode("approve")}>
                  <Icons.checkCircle class="h-4 w-4" />
                  Approve
                </Button>
              </Show>
              <Show when={props.status === "pending" || props.status === "verified"}>
                <Button
                  type="button"
                  size="sm"
                  variant="accent"
                  onClick={() => props.onMode("reject")}
                >
                  <Icons.xCircle class="h-4 w-4" />
                  Reject
                </Button>
              </Show>
              <Show when={props.status === "approved" && !props.accountingNotedBy}>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => props.onMode("accounting")}
                >
                  <Icons.fileText class="h-4 w-4" />
                  Stamp for Accounting
                </Button>
              </Show>
              <Show
                when={
                  props.status === "rejected" ||
                  (props.status === "approved" && props.accountingNotedBy)
                }
              >
                <p class="text-sm text-muted">No further actions for this claim.</p>
              </Show>
            </div>
          }
        >
          <div class="space-y-4">
            <Textarea
              id="rr-notes"
              label={`${label()}${props.mode === "reject" ? " *" : " (optional)"}`}
              rows={3}
              value={props.notes}
              onInput={event => {
                props.onNotes(event.currentTarget.value)
                if (props.showError) props.onClearError()
              }}
              placeholder={
                props.mode === "reject"
                  ? "Tell the claimant why so they can fix and resubmit..."
                  : "Add a note for the claim history..."
              }
              error={props.showError ? "A reason is required to reject." : undefined}
            />
            <div class="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={props.onCancel}
                disabled={props.processing}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={props.mode === "reject" ? "accent" : "primary"}
                size="sm"
                onClick={props.onSubmit}
                loading={props.processing}
                loadingLabel="Submitting..."
              >
                Confirm
              </Button>
            </div>
          </div>
        </Show>
      </div>
    </SectionCard>
  )
}

function SectionCard(props: { title: string; class?: string; children: JSX.Element }) {
  return (
    <section
      class={`mb-8 overflow-hidden rounded-lg border border-border bg-surface ${props.class ?? ""}`}
    >
      <div class="border-b border-border px-6 py-4">
        <h2 class="text-lg font-semibold text-foreground">{props.title}</h2>
      </div>
      {props.children}
    </section>
  )
}

function OverviewMetric(props: { label: string; value: string; mono?: boolean }) {
  return (
    <div class="rounded-lg border border-border bg-surface-muted px-4 py-3">
      <p class="text-xs text-muted">{props.label}</p>
      <p class={`mt-1 text-sm font-medium text-foreground ${props.mono ? "font-mono" : ""}`}>
        {props.value}
      </p>
    </div>
  )
}

function DetailCell(props: { label: string; value: string }) {
  return (
    <div class="px-6 py-4">
      <p class="mb-1 text-xs text-muted">{props.label}</p>
      <p class="text-sm font-medium text-foreground">{props.value}</p>
    </div>
  )
}

function ReceiptPill(props: { hasReceipt: boolean }) {
  return (
    <span
      class={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        props.hasReceipt
          ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
          : "bg-surface-muted text-muted"
      }`}
    >
      <Show when={props.hasReceipt} fallback={<Icons.xCircle class="h-3 w-3" />}>
        <Icons.checkCircle class="h-3 w-3" />
      </Show>
      {props.hasReceipt ? "Yes" : "No"}
    </span>
  )
}

function DocLine(props: { checked: boolean; label: string }) {
  return (
    <span
      class={`inline-flex items-start gap-2 ${props.checked ? "text-foreground" : "text-muted"}`}
    >
      <Show when={props.checked} fallback={<Icons.xCircle class="mt-0.5 h-4 w-4 shrink-0" />}>
        <Icons.checkCircle class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      </Show>
      <span>{props.label}</span>
    </span>
  )
}

function AuditRow(props: {
  stage: string
  who: string | null | undefined
  when: string | null | undefined
  notes: string | null | undefined
}) {
  return (
    <div class="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:gap-6">
      <span class="w-48 text-sm text-muted">{props.stage}</span>
      <span class="text-sm text-foreground">
        {props.who ?? "—"}
        <Show when={props.when}>
          <span class="text-muted"> · {formatDatePH(props.when ?? "")}</span>
        </Show>
      </span>
      <Show when={props.notes}>
        <span class="text-sm text-muted sm:ml-auto sm:max-w-md">"{props.notes}"</span>
      </Show>
    </div>
  )
}

function formatBytes(size: number) {
  if (!Number.isFinite(size) || size <= 0) return ""
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
