import { formatDatePH, formatPeso, Modal, ModalFooter, Select } from "@ark/ui"
import { categoryOptionsBySection, glDefault } from "@data/gl-defaults"
import { useDisbursementAudit, useUpdateDisbursement } from "@data/hooks"
import { profitCenterOptions, updateDisbursementSchema } from "@data/schemas"
import type { Transaction, TransactionAuditEvent, TxnCategory } from "@data/types"
import { validateForm } from "@data/validate"
import { createEffect, createMemo, createSignal, For, type JSX, Show } from "solid-js"
import {
  auditActionLabel,
  auditSummary,
  categoryLabel,
  formatDateTimePH,
} from "./disbursement-labels"

interface DisbursementDetailsModalProps {
  txn: Transaction | null
  onClose: () => void
  onDelete: (txn: Transaction) => void
  canMutate: (txn: Transaction) => boolean
}

export function DisbursementDetailsModal(props: DisbursementDetailsModalProps) {
  const updateDisbursement = useUpdateDisbursement()
  const auditQuery = useDisbursementAudit(() => props.txn?.id)
  const [mode, setMode] = createSignal<"view" | "edit">("view")
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [transactionDate, setTransactionDate] = createSignal("")
  const [payee, setPayee] = createSignal("")
  const [category, setCategory] = createSignal<TxnCategory>("supplies")
  const [amount, setAmount] = createSignal("")
  const [description, setDescription] = createSignal("")
  const [referenceId, setReferenceId] = createSignal("")
  const [profitCenter, setProfitCenter] = createSignal("")
  const [expenseCategory, setExpenseCategory] = createSignal("")
  const [accountingTreatment, setAccountingTreatment] = createSignal("")
  const [needsReview, setNeedsReview] = createSignal(false)

  const txn = () => props.txn
  const categoryOptions = createMemo(() =>
    categoryOptionsBySection().flatMap(group => [
      { label: group.label, value: `group-${group.label}`, disabled: true },
      ...group.options,
    ])
  )

  createEffect(() => {
    const current = props.txn
    if (!current) return
    setMode("view")
    setErrors({})
    setTransactionDate((current.transactionDate ?? current.createdAt).slice(0, 10))
    setPayee(current.payee ?? "")
    setCategory(current.category ?? "other")
    setAmount(String(Math.abs(Number(current.amount))))
    setDescription(current.description ?? "")
    setReferenceId(current.referenceId ?? "")
    setProfitCenter(current.profitCenter ?? "Admin")
    setExpenseCategory(
      current.expenseCategory ?? glDefault(current.category ?? "other")?.expenseCategory ?? ""
    )
    setAccountingTreatment(
      current.accountingTreatment ??
        glDefault(current.category ?? "other")?.accountingTreatment ??
        ""
    )
    setNeedsReview(!!current.metadata?.needsReview)
  })

  const amountValue = () => {
    const value = Number.parseFloat(amount())
    return Number.isNaN(value) ? 0 : value
  }

  const handleCategoryChange = (next: string) => {
    const typed = next as TxnCategory
    setCategory(typed)
    const defaults = glDefault(typed)
    if (defaults) {
      setExpenseCategory(defaults.expenseCategory)
      setAccountingTreatment(defaults.accountingTreatment)
    }
  }

  const save = () => {
    const current = txn()
    if (!current) return
    const data = {
      category: category(),
      transactionDate: transactionDate(),
      payee: payee().trim(),
      amount: amountValue(),
      description: description(),
      referenceId: referenceId().trim(),
      expenseCategory: expenseCategory() || undefined,
      profitCenter: profitCenter() || undefined,
      accountingTreatment: accountingTreatment() || undefined,
      needsReview: needsReview(),
    }
    const result = validateForm(updateDisbursementSchema, data)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    updateDisbursement.mutate(
      { id: current.id, ...result.data },
      {
        onSuccess: () => {
          props.onClose()
        },
      }
    )
  }

  return (
    <Modal open={!!props.txn} onClose={props.onClose} title="Disbursement Details" size="lg">
      <Show when={txn()}>
        {current => (
          <div class="space-y-5">
            <Show
              when={mode() === "view"}
              fallback={
                <DisbursementEditForm
                  errors={errors()}
                  transactionDate={transactionDate()}
                  amount={amount()}
                  payee={payee()}
                  category={category()}
                  referenceId={referenceId()}
                  profitCenter={profitCenter()}
                  description={description()}
                  needsReview={needsReview()}
                  categoryOptions={categoryOptions()}
                  submitting={updateDisbursement.isPending}
                  onTransactionDate={setTransactionDate}
                  onAmount={setAmount}
                  onPayee={setPayee}
                  onCategory={handleCategoryChange}
                  onReferenceId={setReferenceId}
                  onProfitCenter={setProfitCenter}
                  onDescription={setDescription}
                  onNeedsReview={setNeedsReview}
                  onCancel={() => setMode("view")}
                  onSave={save}
                />
              }
            >
              <DisbursementView
                current={current()}
                auditEvents={auditQuery.data ?? []}
                auditLoading={auditQuery.isFetching}
                canMutate={props.canMutate(current())}
                onClose={props.onClose}
                onEdit={() => setMode("edit")}
                onDelete={() => props.onDelete(current())}
              />
            </Show>
          </div>
        )}
      </Show>
    </Modal>
  )
}

function DisbursementEditForm(props: {
  errors: Record<string, string>
  transactionDate: string
  amount: string
  payee: string
  category: TxnCategory
  referenceId: string
  profitCenter: string
  description: string
  needsReview: boolean
  categoryOptions: Array<{ label: string; value: string; disabled?: boolean }>
  submitting: boolean
  onTransactionDate: (value: string) => void
  onAmount: (value: string) => void
  onPayee: (value: string) => void
  onCategory: (value: string) => void
  onReferenceId: (value: string) => void
  onProfitCenter: (value: string) => void
  onDescription: (value: string) => void
  onNeedsReview: (value: boolean) => void
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <div class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date" error={props.errors.transactionDate}>
          <input
            type="date"
            value={props.transactionDate}
            onInput={e => props.onTransactionDate(e.currentTarget.value)}
            class={inputClass}
          />
        </Field>
        <Field label="Amount (PHP)" error={props.errors.amount}>
          <input
            type="number"
            min="0"
            step="0.01"
            value={props.amount}
            onInput={e => props.onAmount(e.currentTarget.value)}
            class={inputClass}
          />
        </Field>
        <Field label="Store / Company" error={props.errors.payee}>
          <input
            type="text"
            value={props.payee}
            onInput={e => props.onPayee(e.currentTarget.value)}
            class={inputClass}
          />
        </Field>
        <Field label="Category" error={props.errors.category}>
          <Select
            value={props.category}
            onChange={props.onCategory}
            options={props.categoryOptions}
            ariaLabel="Category"
          />
        </Field>
        <Field label="Receipt / OR" error={props.errors.referenceId}>
          <input
            type="text"
            value={props.referenceId}
            onInput={e => props.onReferenceId(e.currentTarget.value)}
            class={inputClass}
          />
        </Field>
        <Field label="For" error={props.errors.profitCenter}>
          <Select
            value={props.profitCenter}
            onChange={props.onProfitCenter}
            options={profitCenterOptions.map(value => ({ label: value, value }))}
            ariaLabel="For"
          />
        </Field>
      </div>
      <Field label="What was bought / paid?" error={props.errors.description}>
        <input
          type="text"
          value={props.description}
          onInput={e => props.onDescription(e.currentTarget.value)}
          class={inputClass}
        />
      </Field>
      <label class="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={props.needsReview}
          onChange={e => props.onNeedsReview(e.currentTarget.checked)}
          class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        Needs review
      </label>
      <ModalFooter
        onCancel={props.onCancel}
        cancelLabel="Cancel"
        onSubmit={props.onSave}
        submitLabel="Save"
        submitting={props.submitting}
      />
    </div>
  )
}

function DisbursementView(props: {
  current: Transaction
  auditEvents: TransactionAuditEvent[]
  auditLoading: boolean
  canMutate: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div class="space-y-5">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <Detail
          label="Date"
          value={formatDatePH(props.current.transactionDate ?? props.current.createdAt)}
        />
        <Detail label="Amount" value={formatPeso(Math.abs(Number(props.current.amount)))} strong />
        <Detail label="Store / Company" value={props.current.payee ?? "-"} />
        <Detail label="Category" value={categoryLabel(props.current.category)} />
        <Detail label="For" value={props.current.profitCenter ?? "-"} />
        <Detail label="Receipt / OR" value={props.current.referenceId ?? "-"} />
        <Detail label="Review" value={props.current.metadata?.needsReview ? "Needs review" : "-"} />
        <Detail label="Recorded by" value={props.current.createdBy ?? "-"} />
        <Detail label="Recorded at" value={formatDateTimePH(props.current.createdAt)} />
        <Show when={props.current.metadata?.updatedAt}>
          <Detail
            label="Last updated"
            value={`${formatDateTimePH(props.current.metadata?.updatedAt)} by ${props.current.metadata?.updatedBy ?? "-"}`}
          />
        </Show>
      </div>

      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-muted mb-1">
          What was bought / paid?
        </p>
        <p class="text-sm text-foreground">{props.current.description || "-"}</p>
      </div>

      <div class="border-t border-border pt-4">
        <div class="flex items-center justify-between gap-3 mb-3">
          <h3 class="text-sm font-semibold text-foreground">Audit trail</h3>
          <Show when={props.auditLoading}>
            <span class="text-xs text-muted">Loading...</span>
          </Show>
        </div>
        <Show
          when={props.auditEvents.length > 0}
          fallback={<p class="text-sm text-muted">No audit events yet.</p>}
        >
          <div class="space-y-3">
            <For each={props.auditEvents}>{event => <AuditEventRow event={event} />}</For>
          </div>
        </Show>
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={props.onClose}
          class="px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted rounded-lg transition-colors"
        >
          Close
        </button>
        <Show when={props.canMutate}>
          <button
            type="button"
            onClick={props.onEdit}
            class="px-4 py-2 text-sm font-medium text-foreground border border-border hover:bg-surface-muted rounded-lg transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={props.onDelete}
            class="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-lg transition-colors"
          >
            Delete
          </button>
        </Show>
      </div>
    </div>
  )
}

function Field(props: { label: string; error?: string; children: JSX.Element }) {
  return (
    <div>
      <p class="block text-sm font-medium text-foreground mb-1">{props.label}</p>
      {props.children}
      <Show when={props.error}>
        <p class="text-xs text-red-600 mt-1">{props.error}</p>
      </Show>
    </div>
  )
}

function AuditEventRow(props: { event: TransactionAuditEvent }) {
  return (
    <div class="rounded-lg border border-border bg-surface-muted/40 px-3 py-2">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm font-medium text-foreground">{auditActionLabel(props.event.action)}</p>
        <p class="text-xs text-muted">{formatDateTimePH(props.event.createdAt)}</p>
      </div>
      <p class="text-xs text-muted mt-1">By {props.event.actor ?? "System"}</p>
      <Show when={auditSummary(props.event)}>
        {summary => <p class="text-xs text-foreground mt-2">{summary()}</p>}
      </Show>
    </div>
  )
}

function Detail(props: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p class="text-xs font-medium uppercase tracking-wide text-muted mb-1">{props.label}</p>
      <p class={`text-sm ${props.strong ? "font-semibold tabular-nums" : ""} text-foreground`}>
        {props.value}
      </p>
    </div>
  )
}

const inputClass =
  "w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
