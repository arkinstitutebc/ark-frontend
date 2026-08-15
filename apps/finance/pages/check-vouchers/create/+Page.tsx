import type { CheckVoucherLine, CheckVoucherPaymentLine } from "@ark/data-types"
import { BackLink, Button, DateInput, formatPeso, formInputClass, Icons, Input } from "@ark/ui"
import { useCreateCheckVoucher } from "@data/hooks"
import { createMemo, createSignal, Index, Show } from "solid-js"
import { navigate } from "vike/client/router"

interface PaymentDraft {
  description: string
  amount: string
}

interface AccountDraft {
  account: string
  amount: string
}

const MAX_VOUCHER_LINES = 6
const today = () => new Date().toISOString().slice(0, 10)
const blankPayment = (): PaymentDraft => ({ description: "", amount: "" })
const blankAccount = (): AccountDraft => ({ account: "", amount: "" })

function parseAmount(value: string) {
  const trimmed = value.trim()
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return 0
  const parsed = Number.parseFloat(trimmed)
  return Number.isFinite(parsed) ? parsed : 0
}

function sanitizeMoneyInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "")
  const [whole = "", ...decimalParts] = cleaned.split(".")
  const decimal = decimalParts.join("").slice(0, 2)
  const normalizedWhole = whole.replace(/^0+(?=\d)/, "")
  return decimalParts.length ? `${normalizedWhole || "0"}.${decimal}` : normalizedWhole
}

function paymentValues(lines: PaymentDraft[]): CheckVoucherPaymentLine[] {
  return lines
    .map(line => ({ description: line.description.trim(), amount: parseAmount(line.amount) }))
    .filter(line => line.description && line.amount > 0)
}

function accountValues(lines: AccountDraft[]): CheckVoucherLine[] {
  return lines
    .map(line => ({ account: line.account.trim(), amount: parseAmount(line.amount) }))
    .filter(line => line.account && line.amount > 0)
}

function lineTotal(lines: Array<{ amount: string }>) {
  return lines.reduce((total, line) => total + parseAmount(line.amount), 0)
}

function incompletePayments(lines: PaymentDraft[]) {
  return lines.some(line => {
    const hasContent = line.description.trim() || line.amount.trim()
    return hasContent && (!line.description.trim() || parseAmount(line.amount) <= 0)
  })
}

function incompleteAccounts(lines: AccountDraft[]) {
  return lines.some(line => {
    const hasContent = line.account.trim() || line.amount.trim()
    return hasContent && (!line.account.trim() || parseAmount(line.amount) <= 0)
  })
}

export default function CreateCheckVoucherPage() {
  const [voucherNo, setVoucherNo] = createSignal("")
  const [voucherDate, setVoucherDate] = createSignal(today())
  const [payee, setPayee] = createSignal("")
  const [address, setAddress] = createSignal("")
  const [bankName, setBankName] = createSignal("Security Bank")
  const [checkNo, setCheckNo] = createSignal("")
  const [preparedBy, setPreparedBy] = createSignal("APRIL HEART A. ESCARO")
  const [approvedBy, setApprovedBy] = createSignal("GEMMA A. ESCARO")
  const [receivedBy, setReceivedBy] = createSignal("")
  const [paymentLines, setPaymentLines] = createSignal<PaymentDraft[]>([blankPayment()])
  const [debitLines, setDebitLines] = createSignal<AccountDraft[]>([blankAccount()])
  const [creditLines, setCreditLines] = createSignal<AccountDraft[]>([
    { account: "Cash in bank - SB", amount: "" },
  ])
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const createVoucher = useCreateCheckVoucher()

  const paymentTotal = createMemo(() => lineTotal(paymentLines()))
  const debitTotal = createMemo(() => lineTotal(debitLines()))
  const creditTotal = createMemo(() => lineTotal(creditLines()))
  const totalsMatch = createMemo(
    () =>
      paymentTotal() > 0 &&
      Math.round(paymentTotal() * 100) === Math.round(debitTotal() * 100) &&
      Math.round(debitTotal() * 100) === Math.round(creditTotal() * 100)
  )
  const linesComplete = createMemo(
    () =>
      !incompletePayments(paymentLines()) &&
      !incompleteAccounts(debitLines()) &&
      !incompleteAccounts(creditLines())
  )
  const canSubmit = createMemo(
    () =>
      voucherDate().trim() &&
      payee().trim() &&
      bankName().trim() &&
      paymentTotal() > 0 &&
      linesComplete() &&
      totalsMatch() &&
      !createVoucher.isPending
  )

  const updatePayment = (index: number, field: keyof PaymentDraft, value: string) => {
    const nextValue = field === "amount" ? sanitizeMoneyInput(value) : value
    setPaymentLines(lines =>
      lines.map((line, current) => (current === index ? { ...line, [field]: nextValue } : line))
    )
  }

  const updateAccount = (
    kind: "debit" | "credit",
    index: number,
    field: keyof AccountDraft,
    value: string
  ) => {
    const setter = kind === "debit" ? setDebitLines : setCreditLines
    const nextValue = field === "amount" ? sanitizeMoneyInput(value) : value
    setter(lines =>
      lines.map((line, current) => (current === index ? { ...line, [field]: nextValue } : line))
    )
  }

  const addPayment = () =>
    setPaymentLines(lines =>
      lines.length >= MAX_VOUCHER_LINES ? lines : [...lines, blankPayment()]
    )
  const removePayment = (index: number) =>
    setPaymentLines(lines =>
      lines.length === 1 ? lines : lines.filter((_, current) => current !== index)
    )

  const addAccount = (kind: "debit" | "credit") => {
    const setter = kind === "debit" ? setDebitLines : setCreditLines
    setter(lines => (lines.length >= MAX_VOUCHER_LINES ? lines : [...lines, blankAccount()]))
  }

  const removeAccount = (kind: "debit" | "credit", index: number) => {
    const setter = kind === "debit" ? setDebitLines : setCreditLines
    setter(lines => (lines.length === 1 ? lines : lines.filter((_, current) => current !== index)))
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!voucherDate().trim()) next.voucherDate = "Date is required"
    if (!payee().trim()) next.payee = "Payee is required"
    if (!bankName().trim()) next.bankName = "Bank name is required"
    if (paymentTotal() <= 0) next.paymentLines = "Add at least one payment item"
    if (incompletePayments(paymentLines()))
      next.paymentLines = "Complete or clear every payment item"
    if (incompleteAccounts(debitLines())) next.debitLines = "Complete or clear every debit line"
    if (incompleteAccounts(creditLines())) next.creditLines = "Complete or clear every credit line"
    if (!totalsMatch()) next.balance = "Payment, debit, and credit totals must match"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = (event: Event) => {
    event.preventDefault()
    if (!validate()) return
    createVoucher.mutate(
      {
        voucherNo: voucherNo().trim() || undefined,
        voucherDate: voucherDate(),
        payee: payee().trim(),
        address: address().trim() || undefined,
        bankName: bankName().trim(),
        checkNo: checkNo().trim() || undefined,
        paymentLines: paymentValues(paymentLines()),
        debitLines: accountValues(debitLines()),
        creditLines: accountValues(creditLines()),
        preparedBy: preparedBy().trim() || undefined,
        approvedBy: approvedBy().trim() || undefined,
        receivedBy: receivedBy().trim() || undefined,
      },
      { onSuccess: () => navigate("/check-vouchers") }
    )
  }

  return (
    <div class="px-4 py-5 sm:px-8 sm:py-8 lg:px-12">
      <div class="mx-auto max-w-6xl">
        <div class="mb-6 flex items-start gap-3 sm:mb-8 sm:items-center">
          <BackLink variant="icon" label="Back to check vouchers" href="/check-vouchers" />
          <div>
            <h1 class="text-xl font-semibold text-foreground sm:text-2xl">New Check Voucher</h1>
            <p class="mt-1 text-sm text-muted">
              Record payment items and the balanced accounting entry for printing.
            </p>
          </div>
        </div>

        <form onSubmit={submit}>
          <div class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div class="space-y-6">
              <section class="space-y-4 rounded-lg border border-border bg-surface p-4 sm:p-6">
                <Show when={Object.keys(errors()).length > 0}>
                  <div class="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                    {Object.values(errors())[0]}
                  </div>
                </Show>
                <div>
                  <h2 class="text-lg font-semibold text-foreground">Voucher Details</h2>
                  <p class="mt-1 text-xs text-muted">These fields appear in the document header.</p>
                </div>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Voucher No."
                    value={voucherNo()}
                    onInput={event => setVoucherNo(event.currentTarget.value)}
                    placeholder="0003"
                    hint="Optional; leave blank to assign automatically"
                  />
                  <DateInput
                    label="Date"
                    value={voucherDate()}
                    onValueChange={setVoucherDate}
                    showTodayButton
                  />
                  <Input
                    label="Payee"
                    value={payee()}
                    onInput={event => setPayee(event.currentTarget.value)}
                    placeholder="e.g. CITI Hardware"
                  />
                </div>
                <Input
                  label="Address"
                  value={address()}
                  onInput={event => setAddress(event.currentTarget.value)}
                  hint="Optional"
                />
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Bank Name"
                    value={bankName()}
                    onInput={event => setBankName(event.currentTarget.value)}
                  />
                  <Input
                    label="Check No."
                    value={checkNo()}
                    onInput={event => setCheckNo(event.currentTarget.value)}
                    hint="Optional and fully editable"
                  />
                </div>
              </section>

              <PaymentLines
                lines={paymentLines()}
                onAdd={addPayment}
                onRemove={removePayment}
                onChange={updatePayment}
              />

              <AccountLines
                title="Debit"
                lines={debitLines()}
                onAdd={() => addAccount("debit")}
                onRemove={index => removeAccount("debit", index)}
                onChange={(index, field, value) => updateAccount("debit", index, field, value)}
              />

              <AccountLines
                title="Credit"
                lines={creditLines()}
                onAdd={() => addAccount("credit")}
                onRemove={index => removeAccount("credit", index)}
                onChange={(index, field, value) => updateAccount("credit", index, field, value)}
              />

              <section class="space-y-4 rounded-lg border border-border bg-surface p-4 sm:p-6">
                <div>
                  <h2 class="text-lg font-semibold text-foreground">Signatories</h2>
                  <p class="mt-1 text-xs text-muted">Shown at the bottom of the printed voucher.</p>
                </div>
                <div class="grid gap-4 md:grid-cols-3">
                  <Input
                    label="Prepared by"
                    value={preparedBy()}
                    onInput={event => setPreparedBy(event.currentTarget.value)}
                  />
                  <Input
                    label="Approved by"
                    value={approvedBy()}
                    onInput={event => setApprovedBy(event.currentTarget.value)}
                  />
                  <Input
                    label="Received by"
                    value={receivedBy()}
                    onInput={event => setReceivedBy(event.currentTarget.value)}
                    hint="Optional"
                  />
                </div>
              </section>
            </div>

            <div>
              <aside class="rounded-lg border border-border bg-surface p-4 sm:p-6 xl:sticky xl:top-24">
                <h2 class="mb-4 text-lg font-semibold text-foreground">Balance Summary</h2>
                <div class="space-y-3 text-sm">
                  <SummaryRow label="Payee" value={payee().trim() || "-"} />
                  <SummaryRow label="Voucher No." value={voucherNo().trim() || "Automatic"} />
                  <SummaryRow label="Check No." value={checkNo().trim() || "-"} />
                  <div class="space-y-2 border-t border-border pt-3">
                    <SummaryRow label="Payment items" value={formatPeso(paymentTotal())} />
                    <SummaryRow label="Debit" value={formatPeso(debitTotal())} />
                    <SummaryRow label="Credit" value={formatPeso(creditTotal())} />
                  </div>
                  <div class="border-t border-border pt-3">
                    <div class="flex items-center justify-between gap-3">
                      <span class="font-medium">Status</span>
                      <span
                        class={`text-xs font-semibold ${totalsMatch() ? "text-success" : "text-danger"}`}
                      >
                        {totalsMatch() ? "Balanced" : "Not balanced"}
                      </span>
                    </div>
                    <Show when={!totalsMatch()}>
                      <p class="mt-2 text-xs leading-5 text-danger">
                        Payment, debit, and credit totals must match before saving.
                      </p>
                    </Show>
                  </div>
                </div>

                <Show when={createVoucher.isError}>
                  <div class="mt-4 rounded-lg border border-danger/20 bg-danger/5 p-3">
                    <p class="text-xs text-danger">{createVoucher.error?.message}</p>
                  </div>
                </Show>

                <div class="mt-6 space-y-3">
                  <Button
                    type="submit"
                    disabled={!canSubmit()}
                    size="sm"
                    class="w-full"
                    loading={createVoucher.isPending}
                    loadingLabel="Saving..."
                  >
                    Save Voucher
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    class="w-full"
                    onClick={() => navigate("/check-vouchers")}
                  >
                    Cancel
                  </Button>
                </div>
              </aside>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function SummaryRow(props: { label: string; value: string }) {
  return (
    <div class="flex justify-between gap-3">
      <span class="text-muted">{props.label}</span>
      <span class="break-words text-right font-medium tabular-nums">{props.value}</span>
    </div>
  )
}

function EditorHeader(props: {
  title: string
  description: string
  total: number
  canAdd: boolean
  onAdd: () => void
}) {
  return (
    <div class="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <h2 class="text-lg font-semibold text-foreground">{props.title}</h2>
        <p class="mt-1 text-xs text-muted">{props.description}</p>
      </div>
      <div class="flex items-center gap-3">
        <p class="text-sm font-semibold tabular-nums text-foreground">{formatPeso(props.total)}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!props.canAdd}
          onClick={props.onAdd}
        >
          <Icons.plus class="h-4 w-4" />
          Add line
        </Button>
      </div>
    </div>
  )
}

function PaymentLines(props: {
  lines: PaymentDraft[]
  onAdd: () => void
  onRemove: (index: number) => void
  onChange: (index: number, field: keyof PaymentDraft, value: string) => void
}) {
  return (
    <section class="overflow-hidden rounded-lg border border-border bg-surface">
      <EditorHeader
        title="Payment For"
        description="Each item prints with its own amount in the Particular section."
        total={lineTotal(props.lines)}
        canAdd={props.lines.length < MAX_VOUCHER_LINES}
        onAdd={props.onAdd}
      />
      <Show when={props.lines.length >= MAX_VOUCHER_LINES}>
        <p class="border-b border-border px-4 py-2 text-xs text-muted sm:px-6">
          Maximum {MAX_VOUCHER_LINES} lines for one-page printing.
        </p>
      </Show>
      <div class="hidden border-b border-border bg-surface-muted px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted md:grid md:grid-cols-[minmax(0,1fr)_150px_44px] md:gap-3">
        <span>Description</span>
        <span>Amount</span>
        <span />
      </div>
      <div class="divide-y divide-border">
        <Index each={props.lines}>
          {(line, index) => (
            <div class="grid gap-3 px-4 py-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_150px_44px] md:items-end">
              <label class="block">
                <span class="mb-1 block text-sm font-medium text-foreground md:hidden">
                  Description
                </span>
                <input
                  class={formInputClass()}
                  value={line().description}
                  maxLength={300}
                  onInput={event => props.onChange(index, "description", event.currentTarget.value)}
                  placeholder="e.g. 1st of 24th installment Suzuki Carry Van for Mobile Training"
                  aria-label={`Payment item ${index + 1} description`}
                />
              </label>
              <MoneyInput
                label={`Payment item ${index + 1} amount`}
                value={line().amount}
                onInput={value => props.onChange(index, "amount", value)}
              />
              <RemoveButton
                label="Remove payment item"
                disabled={props.lines.length === 1}
                onClick={() => props.onRemove(index)}
              />
            </div>
          )}
        </Index>
      </div>
    </section>
  )
}

function AccountLines(props: {
  title: "Debit" | "Credit"
  lines: AccountDraft[]
  onAdd: () => void
  onRemove: (index: number) => void
  onChange: (index: number, field: keyof AccountDraft, value: string) => void
}) {
  return (
    <section class="overflow-hidden rounded-lg border border-border bg-surface">
      <EditorHeader
        title={`${props.title} Accounts`}
        description={
          props.title === "Debit"
            ? "Expense or asset accounts."
            : "Bank, cash, or payable accounts."
        }
        total={lineTotal(props.lines)}
        canAdd={props.lines.length < MAX_VOUCHER_LINES}
        onAdd={props.onAdd}
      />
      <Show when={props.lines.length >= MAX_VOUCHER_LINES}>
        <p class="border-b border-border px-4 py-2 text-xs text-muted sm:px-6">
          Maximum {MAX_VOUCHER_LINES} lines for one-page printing.
        </p>
      </Show>
      <div class="hidden border-b border-border bg-surface-muted px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted md:grid md:grid-cols-[minmax(0,1fr)_150px_44px] md:gap-3">
        <span>Account</span>
        <span>Amount</span>
        <span />
      </div>
      <div class="divide-y divide-border">
        <Index each={props.lines}>
          {(line, index) => (
            <div class="grid gap-3 px-4 py-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_150px_44px] md:items-end">
              <label class="block">
                <span class="mb-1 block text-sm font-medium text-foreground md:hidden">
                  Account
                </span>
                <input
                  class={formInputClass()}
                  value={line().account}
                  maxLength={120}
                  onInput={event => props.onChange(index, "account", event.currentTarget.value)}
                  placeholder={
                    props.title === "Debit" ? "Expense or asset account" : "Bank or payable account"
                  }
                  aria-label={`${props.title} line ${index + 1} account`}
                />
              </label>
              <MoneyInput
                label={`${props.title} line ${index + 1} amount`}
                value={line().amount}
                onInput={value => props.onChange(index, "amount", value)}
              />
              <RemoveButton
                label={`Remove ${props.title.toLowerCase()} line`}
                disabled={props.lines.length === 1}
                onClick={() => props.onRemove(index)}
              />
            </div>
          )}
        </Index>
      </div>
    </section>
  )
}

function MoneyInput(props: { label: string; value: string; onInput: (value: string) => void }) {
  return (
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-foreground md:hidden">Amount</span>
      <input
        class={`${formInputClass()} text-right tabular-nums`}
        inputMode="decimal"
        value={props.value}
        onInput={event => props.onInput(event.currentTarget.value)}
        placeholder="0.00"
        aria-label={props.label}
      />
    </label>
  )
}

function RemoveButton(props: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      class="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-danger disabled:pointer-events-none disabled:opacity-40"
      disabled={props.disabled}
      aria-label={props.label}
    >
      <Icons.trash class="h-4 w-4" />
    </button>
  )
}
