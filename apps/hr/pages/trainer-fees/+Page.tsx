import { formatPeso, PageContainer, PageHeader, Select } from "@ark/ui"
import { api } from "@data/api"
import { useAssignTrainer, usePayTrainerFee, useTrainerAssignments, useTrainers } from "@data/hooks"
import type { Bank, Batch } from "@data/types"
import { createQuery } from "@tanstack/solid-query"
import { createSignal, For } from "solid-js"
import { QueryBoundary } from "@/components/ui"

export default function TrainerFeesPage() {
  const assignments = useTrainerAssignments()
  const trainers = useTrainers()
  const batches = createQuery(() => ({
    queryKey: ["training-batches"],
    queryFn: () => api<Batch[]>("/api/training/batches"),
  }))
  const banks = createQuery(() => ({
    queryKey: ["finance-banks"],
    queryFn: () => api<Bank[]>("/api/finance/banks"),
  }))
  const assign = useAssignTrainer()
  const pay = usePayTrainerFee()
  const [trainerId, setTrainerId] = createSignal("")
  const [batchId, setBatchId] = createSignal("")
  const [fee, setFee] = createSignal(0)
  const [payments, setPayments] = createSignal<Record<string, { amount: number; bankId: string }>>(
    {}
  )
  return (
    <PageContainer>
      <PageHeader
        title="Trainer Fees"
        subtitle="Fixed fee per trainer and batch, with partial Finance payments"
      />
      <form
        class="mb-6 grid gap-3 rounded-lg border border-border bg-surface p-5 md:grid-cols-[1fr_1fr_180px_auto]"
        onSubmit={event => {
          event.preventDefault()
          assign.mutate({ trainerId: trainerId(), batchId: batchId(), fixedFee: fee() })
        }}
      >
        <Select
          options={(trainers.data ?? []).map(item => ({ label: item.name, value: item.id }))}
          value={trainerId() || undefined}
          onChange={setTrainerId}
          placeholder="Trainer"
          ariaLabel="Trainer"
        />
        <Select
          options={(batches.data ?? []).map(item => ({
            label: `${item.batchCode} — ${item.trainingName}`,
            value: item.id,
          }))}
          value={batchId() || undefined}
          onChange={setBatchId}
          placeholder="Batch"
          ariaLabel="Batch"
        />
        <input
          type="number"
          min="0.01"
          step="0.01"
          required
          value={fee() || ""}
          onInput={event => setFee(Number(event.currentTarget.value))}
          placeholder="Fixed fee"
          class="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          Assign
        </button>
      </form>
      <QueryBoundary query={assignments}>
        {rows => (
          <div class="space-y-3">
            <For each={rows}>
              {row => {
                const current = () => payments()[row.assignment.id] ?? { amount: 0, bankId: "" }
                return (
                  <article class="rounded-lg border border-border bg-surface p-5">
                    <div class="flex flex-wrap justify-between gap-3">
                      <div>
                        <p class="font-medium">{row.trainer.name}</p>
                        <p class="text-sm text-muted">
                          {row.batch.batchCode} —{" "}
                          {row.batch.trainingOfferingLabel || row.batch.trainingName}
                        </p>
                      </div>
                      <div class="text-right text-sm">
                        <p>{formatPeso(Number(row.assignment.fixedFee))} fee</p>
                        <p class="text-muted">
                          {formatPeso(row.paidAmount)} paid · {formatPeso(row.outstandingAmount)}{" "}
                          due
                        </p>
                      </div>
                    </div>
                    <div class="mt-4 grid gap-2 border-t border-border pt-4 md:grid-cols-[160px_1fr_auto]">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={current().amount || ""}
                        onInput={event =>
                          setPayments(all => ({
                            ...all,
                            [row.assignment.id]: {
                              ...current(),
                              amount: Number(event.currentTarget.value),
                            },
                          }))
                        }
                        placeholder="Payment"
                        class="rounded-lg border border-border px-3 py-2 text-sm"
                      />
                      <Select
                        options={(banks.data ?? []).map(bank => ({
                          label: bank.name,
                          value: bank.id,
                        }))}
                        value={current().bankId || undefined}
                        onChange={value =>
                          setPayments(all => ({
                            ...all,
                            [row.assignment.id]: { ...current(), bankId: value },
                          }))
                        }
                        placeholder="Bank"
                        ariaLabel="Bank"
                      />
                      <button
                        type="button"
                        disabled={!current().amount || !current().bankId}
                        onClick={() =>
                          pay.mutate({
                            id: row.assignment.id,
                            amount: current().amount,
                            bankId: current().bankId,
                            paymentDate: new Date().toISOString().slice(0, 10),
                          })
                        }
                        class="rounded-lg bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
                      >
                        Record payment
                      </button>
                    </div>
                  </article>
                )
              }}
            </For>
          </div>
        )}
      </QueryBoundary>
    </PageContainer>
  )
}
