import { formatDatePH, formatPeso, PageContainer, PageHeader, Select } from "@ark/ui"
import { api } from "@data/api"
import { useLiquidations, useReviewPoLiquidation } from "@data/hooks"
import type { Bank, PoLiquidationListItem } from "@data/types"
import { createQuery } from "@tanstack/solid-query"
import { createSignal, For, Show } from "solid-js"
import { QueryBoundary, StatusBadge } from "@/components/ui"

function LiquidationCard(props: { item: PoLiquidationListItem; banks: Bank[] }) {
  const mutation = useReviewPoLiquidation()
  const [bankId, setBankId] = createSignal("")
  const [notes, setNotes] = createSignal("")
  const liquidation = () => props.item.liquidation
  const po = () => props.item.purchaseOrder

  return (
    <article class="rounded-lg border border-border bg-surface p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="font-mono text-sm font-semibold">{po().poCode}</span>
            <StatusBadge status={liquidation().status} />
          </div>
          <p class="mt-1 text-sm text-muted">
            Submitted {formatDatePH(liquidation().submittedAt)} by{" "}
            {liquidation().submittedByEmail || "—"}
          </p>
        </div>
        <a href={`/orders/${po().id}`} class="text-sm font-medium text-primary">
          Open PO
        </a>
      </div>
      <div class="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <p class="text-xs text-muted">PO amount</p>
          <p class="font-semibold">{formatPeso(Number(po().totalAmount))}</p>
        </div>
        <div>
          <p class="text-xs text-muted">Actual spent</p>
          <p class="font-semibold">{formatPeso(Number(liquidation().actualAmount))}</p>
        </div>
        <div>
          <p class="text-xs text-muted">Variance</p>
          <p class="font-semibold">{formatPeso(Number(liquidation().varianceAmount))}</p>
        </div>
        <div>
          <p class="text-xs text-muted">Receipts</p>
          <p class="font-semibold">{liquidation().receipts.length}</p>
        </div>
      </div>
      <Show when={liquidation().varianceReason}>
        <p class="mt-3 rounded bg-surface-muted p-3 text-sm">{liquidation().varianceReason}</p>
      </Show>
      <div class="mt-3 flex flex-wrap gap-2">
        <For each={liquidation().receipts}>
          {receipt => (
            <a
              href={receipt.url}
              target="_blank"
              rel="noopener"
              class="text-xs font-medium text-primary underline"
            >
              {receipt.name}
            </a>
          )}
        </For>
      </div>
      <Show when={liquidation().status === "submitted"}>
        <div class="mt-5 grid gap-3 border-t border-border pt-4 md:grid-cols-[1fr_2fr_auto]">
          <Select
            options={props.banks.map(bank => ({
              label: `${bank.name} — ${bank.bankName}`,
              value: bank.id,
            }))}
            value={bankId() || undefined}
            onChange={setBankId}
            placeholder="Payment account"
            ariaLabel="Payment account"
          />
          <input
            value={notes()}
            onInput={event => setNotes(event.currentTarget.value)}
            placeholder="Finance review notes"
            class="rounded-lg border border-border px-3 py-2 text-sm"
          />
          <div class="flex gap-2">
            <button
              type="button"
              onClick={() =>
                mutation.mutate({ id: liquidation().id, action: "reject", notes: notes() })
              }
              class="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700"
            >
              Reject
            </button>
            <button
              type="button"
              disabled={!bankId()}
              onClick={() =>
                mutation.mutate({
                  id: liquidation().id,
                  action: "approve",
                  bankId: bankId(),
                  notes: notes(),
                })
              }
              class="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Approve & Post
            </button>
          </div>
        </div>
      </Show>
    </article>
  )
}

export default function LiquidationPage() {
  const query = useLiquidations()
  const banksQuery = createQuery(() => ({
    queryKey: ["finance-banks"],
    queryFn: () => api<Bank[]>("/api/finance/banks"),
  }))
  return (
    <PageContainer>
      <PageHeader
        title="Finance / Liquidation"
        subtitle="Review actual PO spending, receipts, surplus, and excess amounts"
      />
      <QueryBoundary query={query}>
        {items => (
          <Show
            when={items.length > 0}
            fallback={
              <div class="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted">
                No PO liquidations have been submitted.
              </div>
            }
          >
            <div class="space-y-4">
              <For each={items}>
                {item => <LiquidationCard item={item} banks={banksQuery.data ?? []} />}
              </For>
            </div>
          </Show>
        )}
      </QueryBoundary>
    </PageContainer>
  )
}
