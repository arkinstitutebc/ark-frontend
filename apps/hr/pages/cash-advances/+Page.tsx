import {
  type AttachmentRef,
  AttachmentUploader,
  formatDatePH,
  formatPeso,
  PageContainer,
  PageHeader,
  Select,
} from "@ark/ui"
import { api } from "@data/api"
import {
  useCashAdvanceAction,
  useCashAdvances,
  useCreateCashAdvance,
  useEmployees,
  useLiquidateCashAdvance,
} from "@data/hooks"
import type { Bank, Batch } from "@data/types"
import { createQuery } from "@tanstack/solid-query"
import { createSignal, For, Show } from "solid-js"
import { QueryBoundary, StatusBadge } from "@/components/ui"

export default function CashAdvancesPage() {
  const query = useCashAdvances()
  const employees = useEmployees()
  const createAdvance = useCreateCashAdvance()
  const action = useCashAdvanceAction()
  const liquidate = useLiquidateCashAdvance()
  const batches = createQuery(() => ({
    queryKey: ["training-batches"],
    queryFn: () => api<Batch[]>("/api/training/batches"),
  }))
  const banks = createQuery(() => ({
    queryKey: ["finance-banks"],
    queryFn: () => api<Bank[]>("/api/finance/banks"),
  }))
  const [personId, setPersonId] = createSignal("")
  const [batchId, setBatchId] = createSignal("")
  const [amount, setAmount] = createSignal(0)
  const [purpose, setPurpose] = createSignal("")
  const [releaseBanks, setReleaseBanks] = createSignal<Record<string, string>>({})
  const [liquidatedAmounts, setLiquidatedAmounts] = createSignal<Record<string, number>>({})
  const [liquidationNotes, setLiquidationNotes] = createSignal<Record<string, string>>({})
  const [receipts, setReceipts] = createSignal<Record<string, AttachmentRef[]>>({})
  return (
    <PageContainer>
      <PageHeader
        title="Cash Advances"
        subtitle="Request, approve, release, and liquidate operational cash advances; no payroll deduction"
      />
      <form
        class="mb-6 grid gap-3 rounded-lg border border-border bg-surface p-5 md:grid-cols-2"
        onSubmit={event => {
          event.preventDefault()
          createAdvance.mutate({
            personId: personId(),
            batchId: batchId() || undefined,
            amount: amount(),
            purpose: purpose(),
          })
        }}
      >
        <Select
          options={(employees.data ?? []).map(row => ({
            label: row.person.name,
            value: row.person.id,
          }))}
          value={personId() || undefined}
          onChange={setPersonId}
          placeholder="Employee"
          ariaLabel="Employee"
        />
        <Select
          options={[
            { label: "Company overhead / no batch", value: "" },
            ...(batches.data ?? []).map(batch => ({
              label: `${batch.batchCode} — ${batch.trainingName}`,
              value: batch.id,
            })),
          ]}
          value={batchId()}
          onChange={setBatchId}
          placeholder="Optional batch"
          ariaLabel="Batch"
        />
        <input
          type="number"
          min="0.01"
          step="0.01"
          required
          value={amount() || ""}
          onInput={event => setAmount(Number(event.currentTarget.value))}
          placeholder="Amount"
          class="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <div class="flex gap-2">
          <input
            required
            value={purpose()}
            onInput={event => setPurpose(event.currentTarget.value)}
            placeholder="Purpose"
            class="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Request
          </button>
        </div>
      </form>
      <QueryBoundary query={query}>
        {rows => (
          <div class="space-y-3">
            <For each={rows}>
              {row => (
                <article class="rounded-lg border border-border bg-surface p-5">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div class="flex items-center gap-2">
                        <p class="font-medium">{row.person.name}</p>
                        <StatusBadge status={row.cashAdvance.status} />
                      </div>
                      <p class="text-sm text-muted">
                        {row.cashAdvance.purpose} · {formatDatePH(row.cashAdvance.createdAt)}
                      </p>
                    </div>
                    <p class="text-lg font-semibold">
                      {formatPeso(Number(row.cashAdvance.amount))}
                    </p>
                  </div>
                  <Show when={row.cashAdvance.batchId}>
                    <p class="mt-2 text-xs text-muted">
                      This advance is charged against a training batch budget.
                    </p>
                  </Show>
                  <Show when={row.cashAdvance.status === "requested"}>
                    <div class="mt-4 flex gap-2 border-t border-border pt-4">
                      <button
                        type="button"
                        onClick={() => action.mutate({ id: row.cashAdvance.id, action: "reject" })}
                        class="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => action.mutate({ id: row.cashAdvance.id, action: "approve" })}
                        class="rounded-lg bg-primary px-3 py-2 text-sm text-white"
                      >
                        Approve
                      </button>
                    </div>
                  </Show>
                  <Show when={row.cashAdvance.status === "approved"}>
                    <div class="mt-4 flex gap-2 border-t border-border pt-4">
                      <Select
                        options={(banks.data ?? []).map(bank => ({
                          label: bank.name,
                          value: bank.id,
                        }))}
                        value={releaseBanks()[row.cashAdvance.id]}
                        onChange={value =>
                          setReleaseBanks(all => ({ ...all, [row.cashAdvance.id]: value }))
                        }
                        placeholder="Release bank"
                        ariaLabel="Release bank"
                      />
                      <button
                        type="button"
                        disabled={!releaseBanks()[row.cashAdvance.id]}
                        onClick={() =>
                          action.mutate({
                            id: row.cashAdvance.id,
                            action: "release",
                            bankId: releaseBanks()[row.cashAdvance.id],
                          })
                        }
                        class="rounded-lg bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
                      >
                        Release
                      </button>
                    </div>
                  </Show>
                  <Show when={row.cashAdvance.status === "released"}>
                    <form
                      class="mt-4 grid gap-3 border-t border-border pt-4 md:grid-cols-[12rem_1fr_auto]"
                      onSubmit={event => {
                        event.preventDefault()
                        const receipt = receipts()[row.cashAdvance.id]?.[0]
                        if (!receipt) return
                        liquidate.mutate({
                          id: row.cashAdvance.id,
                          amount:
                            liquidatedAmounts()[row.cashAdvance.id] ??
                            Number(row.cashAdvance.amount),
                          receiptUrl: receipt.url,
                          notes: liquidationNotes()[row.cashAdvance.id] || undefined,
                        })
                      }}
                    >
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={
                          liquidatedAmounts()[row.cashAdvance.id] ?? Number(row.cashAdvance.amount)
                        }
                        onInput={event =>
                          setLiquidatedAmounts(values => ({
                            ...values,
                            [row.cashAdvance.id]: Number(event.currentTarget.value),
                          }))
                        }
                        class="rounded-lg border border-border px-3 py-2 text-sm"
                        aria-label="Liquidated amount"
                      />
                      <div class="space-y-2">
                        <AttachmentUploader
                          attachments={receipts()[row.cashAdvance.id] ?? []}
                          onChange={files =>
                            setReceipts(values => ({
                              ...values,
                              [row.cashAdvance.id]: files.slice(-1),
                            }))
                          }
                          signatureEndpoint="/api/procurement/upload-signature/attachment"
                        />
                        <input
                          value={liquidationNotes()[row.cashAdvance.id] ?? ""}
                          onInput={event =>
                            setLiquidationNotes(values => ({
                              ...values,
                              [row.cashAdvance.id]: event.currentTarget.value,
                            }))
                          }
                          placeholder="Liquidation notes"
                          class="w-full rounded-lg border border-border px-3 py-2 text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!receipts()[row.cashAdvance.id]?.length || liquidate.isPending}
                        class="self-start rounded-lg bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
                      >
                        Liquidate
                      </button>
                    </form>
                  </Show>
                  <Show when={row.cashAdvance.status === "liquidated"}>
                    <div class="mt-4 flex flex-wrap gap-4 border-t border-border pt-4 text-sm">
                      <span>
                        Actual: {formatPeso(Number(row.cashAdvance.liquidatedAmount ?? 0))}
                      </span>
                      <Show when={row.cashAdvance.liquidationReceiptUrl}>
                        <a
                          href={row.cashAdvance.liquidationReceiptUrl ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="font-medium text-primary hover:underline"
                        >
                          View receipt
                        </a>
                      </Show>
                    </div>
                  </Show>
                </article>
              )}
            </For>
          </div>
        )}
      </QueryBoundary>
    </PageContainer>
  )
}
