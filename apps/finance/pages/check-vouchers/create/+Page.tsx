import type { CheckVoucherLine } from "@ark/data-types"
import { BackLink, Button, DateInput, formatPeso, formInputClass, Icons, Input } from "@ark/ui"
import { useCreateCheckVoucher } from "@data/hooks"
import { createMemo, createSignal, Index, Show } from "solid-js"
import { navigate } from "vike/client/router"

interface LineDraft {
  account: string
  description: string
  amount: string
}

const MAX_VOUCHER_LINES = 6
const today = () => new Date().toISOString().slice(0, 10)
const blankLine = (): LineDraft => ({ account: "", description: "", amount: "" })

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

function toLines(lines: LineDraft[]): CheckVoucherLine[] {
  return lines
    .map(line => ({
      account: line.account.trim(),
      description: line.description.trim() || undefined,
      amount: parseAmount(line.amount),
    }))
    .filter(line => line.account && line.amount > 0)
}

function lineTotal(lines: LineDraft[]) {
  return toLines(lines).reduce((total, line) => total + line.amount, 0)
}

function hasLineContent(line: LineDraft) {
  return line.account.trim() || line.description.trim() || line.amount.trim()
}

function hasIncompleteLine(lines: LineDraft[]) {
  return lines.some(
    line => hasLineContent(line) && (!line.account.trim() || parseAmount(line.amount) <= 0)
  )
}

export default function CreateCheckVoucherPage() {
  const [voucherDate, setVoucherDate] = createSignal(today())
  const [payee, setPayee] = createSignal("")
  const [address, setAddress] = createSignal("")
  const [bankName, setBankName] = createSignal("Security Bank")
  const [checkNo, setCheckNo] = createSignal("")
  const [particular, setParticular] = createSignal("")
  const [preparedBy, setPreparedBy] = createSignal("APRIL HEART A. ESCARO")
  const [approvedBy, setApprovedBy] = createSignal("GEMMA A. ESCARO")
  const [receivedBy, setReceivedBy] = createSignal("")
  const [debitLines, setDebitLines] = createSignal<LineDraft[]>([blankLine()])
  const [creditLines, setCreditLines] = createSignal<LineDraft[]>([
    { account: "Security Bank", description: "", amount: "" },
  ])
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const createVoucher = useCreateCheckVoucher()

  const debitTotal = createMemo(() => lineTotal(debitLines()))
  const creditTotal = createMemo(() => lineTotal(creditLines()))
  const totalsMatch = createMemo(
    () => Math.round(debitTotal() * 100) === Math.round(creditTotal() * 100)
  )
  const linesComplete = createMemo(
    () => !hasIncompleteLine(debitLines()) && !hasIncompleteLine(creditLines())
  )
  const canSubmit = createMemo(
    () =>
      voucherDate().trim() &&
      payee().trim() &&
      bankName().trim() &&
      particular().trim() &&
      debitTotal() > 0 &&
      linesComplete() &&
      totalsMatch() &&
      !createVoucher.isPending
  )

  const updateLine = (
    kind: "debit" | "credit",
    index: number,
    field: keyof LineDraft,
    value: string
  ) => {
    const setter = kind === "debit" ? setDebitLines : setCreditLines
    const nextValue = field === "amount" ? sanitizeMoneyInput(value) : value
    setter(lines => lines.map((line, i) => (i === index ? { ...line, [field]: nextValue } : line)))
  }

  const addLine = (kind: "debit" | "credit") => {
    const setter = kind === "debit" ? setDebitLines : setCreditLines
    setter(lines => (lines.length >= MAX_VOUCHER_LINES ? lines : [...lines, blankLine()]))
  }

  const removeLine = (kind: "debit" | "credit", index: number) => {
    const setter = kind === "debit" ? setDebitLines : setCreditLines
    setter(lines => (lines.length === 1 ? lines : lines.filter((_, i) => i !== index)))
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!voucherDate().trim()) next.voucherDate = "Date is required"
    if (!payee().trim()) next.payee = "Payee is required"
    if (!bankName().trim()) next.bankName = "Bank name is required"
    if (!particular().trim()) next.particular = "Particular is required"
    if (debitTotal() <= 0) next.lines = "Add at least one debit line"
    if (hasIncompleteLine(debitLines())) next.debitLines = "Complete or clear every debit line"
    if (hasIncompleteLine(creditLines())) next.creditLines = "Complete or clear every credit line"
    if (!totalsMatch()) next.balance = "Debit and credit totals must match"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = (e: Event) => {
    e.preventDefault()
    if (!validate()) return
    createVoucher.mutate(
      {
        voucherDate: voucherDate(),
        payee: payee().trim(),
        address: address().trim() || undefined,
        bankName: bankName().trim(),
        checkNo: checkNo().trim() || undefined,
        particular: particular().trim(),
        debitLines: toLines(debitLines()),
        creditLines: toLines(creditLines()),
        preparedBy: preparedBy().trim() || undefined,
        approvedBy: approvedBy().trim() || undefined,
        receivedBy: receivedBy().trim() || undefined,
      },
      { onSuccess: () => navigate("/check-vouchers") }
    )
  }

  return (
    <div class="px-6 py-8 sm:px-8 lg:px-12">
      <div class="mx-auto max-w-6xl">
        <div class="mb-8 flex items-center gap-3">
          <BackLink variant="icon" label="Back to check vouchers" href="/check-vouchers" />
          <div>
            <h1 class="text-2xl font-semibold text-foreground">New Check Voucher</h1>
            <p class="mt-1 text-sm text-muted">Create a printable voucher with balanced entries.</p>
          </div>
        </div>

        <form onSubmit={submit}>
          <div class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div class="space-y-6">
              <section class="space-y-4 rounded-lg border border-border bg-surface p-6">
                <Show when={Object.keys(errors()).length > 0}>
                  <div class="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                    {Object.values(errors())[0]}
                  </div>
                </Show>
                <div>
                  <h2 class="text-lg font-semibold text-foreground">Voucher Details</h2>
                  <p class="mt-1 text-xs text-muted">
                    This creates the printable check voucher record only.
                  </p>
                </div>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DateInput
                    label="Date"
                    value={voucherDate()}
                    onValueChange={setVoucherDate}
                    showTodayButton
                  />
                  <Input
                    label="Payee"
                    value={payee()}
                    onInput={e => setPayee(e.currentTarget.value)}
                    placeholder="e.g. CITI Hardware"
                  />
                </div>
                <Input
                  label="Particular"
                  value={particular()}
                  onInput={e => setParticular(e.currentTarget.value)}
                  placeholder="e.g. Range hood"
                />
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Bank Name"
                    value={bankName()}
                    onInput={e => setBankName(e.currentTarget.value)}
                  />
                  <Input
                    label="Check No."
                    value={checkNo()}
                    onInput={e => setCheckNo(e.currentTarget.value)}
                    hint="Optional"
                  />
                </div>
                <Input
                  label="Address"
                  value={address()}
                  onInput={e => setAddress(e.currentTarget.value)}
                  hint="Optional"
                />
              </section>

              <VoucherLines
                title="Debit"
                lines={debitLines()}
                onAdd={() => addLine("debit")}
                onRemove={index => removeLine("debit", index)}
                onChange={(index, field, value) => updateLine("debit", index, field, value)}
              />

              <VoucherLines
                title="Credit"
                lines={creditLines()}
                onAdd={() => addLine("credit")}
                onRemove={index => removeLine("credit", index)}
                onChange={(index, field, value) => updateLine("credit", index, field, value)}
              />

              <section class="space-y-4 rounded-lg border border-border bg-surface p-6">
                <div>
                  <h2 class="text-lg font-semibold text-foreground">Signatories</h2>
                  <p class="mt-1 text-xs text-muted">Shown at the bottom of the printed voucher.</p>
                </div>
                <div class="grid gap-4 md:grid-cols-3">
                  <Input
                    label="Prepared by"
                    value={preparedBy()}
                    onInput={e => setPreparedBy(e.currentTarget.value)}
                  />
                  <Input
                    label="Approved by"
                    value={approvedBy()}
                    onInput={e => setApprovedBy(e.currentTarget.value)}
                  />
                  <Input
                    label="Received by"
                    value={receivedBy()}
                    onInput={e => setReceivedBy(e.currentTarget.value)}
                    hint="Optional"
                  />
                </div>
              </section>
            </div>

            <div>
              <aside class="sticky top-24 rounded-lg border border-border bg-surface p-6">
                <h2 class="mb-4 text-lg font-semibold text-foreground">Summary</h2>
                <div class="space-y-3 text-sm">
                  <div class="flex justify-between gap-3">
                    <span class="text-muted">Payee</span>
                    <span class="text-right font-medium">{payee().trim() || "-"}</span>
                  </div>
                  <div class="flex justify-between gap-3">
                    <span class="text-muted">Bank</span>
                    <span class="text-right font-medium">{bankName().trim() || "-"}</span>
                  </div>
                  <div class="flex justify-between gap-3">
                    <span class="text-muted">Check No.</span>
                    <span class="text-right font-medium">{checkNo().trim() || "-"}</span>
                  </div>
                  <div class="border-t border-border pt-3">
                    <div class="flex justify-between">
                      <span class="text-muted">Debit</span>
                      <span class="font-medium tabular-nums">{formatPeso(debitTotal())}</span>
                    </div>
                    <div class="mt-2 flex justify-between">
                      <span class="text-muted">Credit</span>
                      <span class="font-medium tabular-nums">{formatPeso(creditTotal())}</span>
                    </div>
                  </div>
                  <div class="border-t border-border pt-3">
                    <div class="flex justify-between">
                      <span class="font-medium">Grand Total</span>
                      <span class="text-xl font-semibold tabular-nums text-foreground">
                        {formatPeso(debitTotal())}
                      </span>
                    </div>
                    <Show when={!totalsMatch()}>
                      <p class="mt-2 text-xs text-danger">Debit and credit totals must match.</p>
                    </Show>
                  </div>
                </div>

                <Show when={createVoucher.isError}>
                  <div class="mt-4 rounded-lg bg-red-50 p-3">
                    <p class="text-xs text-red-700">{createVoucher.error?.message}</p>
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

function VoucherLines(props: {
  title: "Debit" | "Credit"
  lines: LineDraft[]
  onAdd: () => void
  onRemove: (index: number) => void
  onChange: (index: number, field: keyof LineDraft, value: string) => void
}) {
  const total = () => lineTotal(props.lines)
  const fieldLabel = (label: string, index: number) =>
    `${props.title} line ${index + 1} ${label.toLowerCase()}`

  return (
    <section class="overflow-hidden rounded-lg border border-border bg-surface">
      <div class="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-foreground">{props.title} Lines</h2>
          <p class="mt-1 text-xs text-muted">
            {props.title === "Debit" ? "Expense or asset accounts." : "Bank or cash account."}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <p class="text-sm font-semibold tabular-nums text-foreground">{formatPeso(total())}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={props.lines.length >= MAX_VOUCHER_LINES}
            onClick={props.onAdd}
          >
            <Icons.plus class="h-4 w-4" />
            Add line
          </Button>
        </div>
      </div>
      <Show when={props.lines.length >= MAX_VOUCHER_LINES}>
        <p class="border-b border-border px-6 py-2 text-xs text-muted">
          Maximum {MAX_VOUCHER_LINES} lines for one-page printing.
        </p>
      </Show>
      <div class="hidden border-b border-border bg-surface-muted px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_150px_44px] md:gap-3">
        <span>Account</span>
        <span>Description</span>
        <span>Amount</span>
        <span />
      </div>
      <div class="divide-y divide-border">
        <Index each={props.lines}>
          {(line, index) => (
            <div class="grid gap-3 px-6 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_150px_44px] md:items-end">
              <label class="block">
                <span class="mb-1 block text-sm font-medium text-foreground md:hidden">
                  Account
                </span>
                <input
                  class={formInputClass()}
                  value={line().account}
                  onInput={e => props.onChange(index, "account", e.currentTarget.value)}
                  placeholder={props.title === "Debit" ? "Expense account" : "Bank / cash account"}
                  aria-label={fieldLabel("Account", index)}
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium text-foreground md:hidden">
                  Description
                </span>
                <input
                  class={formInputClass()}
                  value={line().description}
                  onInput={e => props.onChange(index, "description", e.currentTarget.value)}
                  placeholder="Optional"
                  aria-label={fieldLabel("Description", index)}
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium text-foreground md:hidden">Amount</span>
                <input
                  class={`${formInputClass()} text-right tabular-nums`}
                  inputMode="decimal"
                  value={line().amount}
                  onInput={e => props.onChange(index, "amount", e.currentTarget.value)}
                  placeholder="0.00"
                  aria-label={fieldLabel("Amount", index)}
                />
              </label>
              <button
                type="button"
                onClick={() => props.onRemove(index)}
                class="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-danger disabled:pointer-events-none disabled:opacity-40"
                disabled={props.lines.length === 1}
                aria-label={`Remove ${props.title.toLowerCase()} line`}
              >
                <Icons.trash class="h-4 w-4" />
              </button>
            </div>
          )}
        </Index>
      </div>
    </section>
  )
}
