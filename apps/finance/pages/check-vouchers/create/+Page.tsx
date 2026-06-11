import type { CheckVoucherLine } from "@ark/data-types"
import { BackLink, Button, formatPeso, Icons, Input, PageContainer } from "@ark/ui"
import { useCreateCheckVoucher } from "@data/hooks"
import { createMemo, createSignal, For, Show } from "solid-js"
import { navigate } from "vike/client/router"

interface LineDraft {
  account: string
  description: string
  amount: string
}

const today = () => new Date().toISOString().slice(0, 10)
const blankLine = (): LineDraft => ({ account: "", description: "", amount: "" })

function parseAmount(value: string) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
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
  const canSubmit = createMemo(
    () =>
      voucherDate().trim() &&
      payee().trim() &&
      bankName().trim() &&
      particular().trim() &&
      debitTotal() > 0 &&
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
    setter(lines => lines.map((line, i) => (i === index ? { ...line, [field]: value } : line)))
  }

  const addLine = (kind: "debit" | "credit") => {
    const setter = kind === "debit" ? setDebitLines : setCreditLines
    setter(lines => [...lines, blankLine()])
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
    <PageContainer>
      <BackLink
        variant="icon"
        label="Back to check vouchers"
        onClick={() => navigate("/check-vouchers")}
      />

      <form onSubmit={submit} class="mx-auto max-w-6xl space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-foreground">New Check Voucher</h1>
            <p class="mt-1 text-sm text-muted">Create a printable voucher with balanced entries.</p>
          </div>
          <div class="rounded-lg border border-border bg-surface px-4 py-3 text-right">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted">Grand total</p>
            <p class="mt-1 text-2xl font-semibold text-foreground">{formatPeso(debitTotal())}</p>
          </div>
        </div>

        <Show when={Object.keys(errors()).length > 0}>
          <div class="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
            {Object.values(errors())[0]}
          </div>
        </Show>

        <section class="rounded-lg border border-border bg-surface p-5">
          <h2 class="text-sm font-semibold text-foreground">Voucher Details</h2>
          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <Input
              label="Date"
              type="date"
              value={voucherDate()}
              onInput={e => setVoucherDate(e.currentTarget.value)}
            />
            <Input label="Payee" value={payee()} onInput={e => setPayee(e.currentTarget.value)} />
            <Input
              label="Address"
              value={address()}
              onInput={e => setAddress(e.currentTarget.value)}
            />
            <Input
              label="Bank Name"
              value={bankName()}
              onInput={e => setBankName(e.currentTarget.value)}
            />
            <Input
              label="Check No."
              value={checkNo()}
              onInput={e => setCheckNo(e.currentTarget.value)}
            />
            <Input
              label="Particular"
              value={particular()}
              onInput={e => setParticular(e.currentTarget.value)}
            />
          </div>
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

        <section class="rounded-lg border border-border bg-surface p-5">
          <h2 class="text-sm font-semibold text-foreground">Signatories</h2>
          <div class="mt-4 grid gap-4 md:grid-cols-3">
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
            />
          </div>
        </section>

        <div class="sticky bottom-0 -mx-4 border-t border-border bg-background/95 px-4 py-4 backdrop-blur">
          <div class="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="text-sm">
              <span class="font-medium text-foreground">Debit {formatPeso(debitTotal())}</span>
              <span class="mx-2 text-muted">/</span>
              <span class="font-medium text-foreground">Credit {formatPeso(creditTotal())}</span>
              <Show when={!totalsMatch()}>
                <span class="ml-3 text-danger">Totals do not match</span>
              </Show>
            </div>
            <div class="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => navigate("/check-vouchers")}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit()} loading={createVoucher.isPending}>
                Save Voucher
              </Button>
            </div>
          </div>
        </div>
      </form>
    </PageContainer>
  )
}

function VoucherLines(props: {
  title: "Debit" | "Credit"
  lines: LineDraft[]
  onAdd: () => void
  onRemove: (index: number) => void
  onChange: (index: number, field: keyof LineDraft, value: string) => void
}) {
  return (
    <section class="rounded-lg border border-border bg-surface p-5">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-sm font-semibold text-foreground">{props.title} Lines</h2>
        <Button type="button" variant="ghost" size="sm" onClick={props.onAdd}>
          <Icons.plus class="h-4 w-4" />
          Add line
        </Button>
      </div>
      <div class="mt-4 space-y-3">
        <For each={props.lines}>
          {(line, index) => (
            <div class="grid gap-3 md:grid-cols-[1fr_1fr_160px_44px]">
              <Input
                label={index() === 0 ? "Account" : undefined}
                value={line.account}
                onInput={e => props.onChange(index(), "account", e.currentTarget.value)}
                placeholder={props.title === "Debit" ? "Expense account" : "Bank / cash account"}
              />
              <Input
                label={index() === 0 ? "Description" : undefined}
                value={line.description}
                onInput={e => props.onChange(index(), "description", e.currentTarget.value)}
                placeholder="Optional"
              />
              <Input
                label={index() === 0 ? "Amount" : undefined}
                type="number"
                min="0"
                step="0.01"
                value={line.amount}
                onInput={e => props.onChange(index(), "amount", e.currentTarget.value)}
              />
              <button
                type="button"
                onClick={() => props.onRemove(index())}
                class="mt-auto inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-danger disabled:pointer-events-none disabled:opacity-40"
                disabled={props.lines.length === 1}
                aria-label={`Remove ${props.title.toLowerCase()} line`}
              >
                <Icons.trash class="h-4 w-4" />
              </button>
            </div>
          )}
        </For>
      </div>
    </section>
  )
}
