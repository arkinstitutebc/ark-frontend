import {
  AttachmentUploader,
  formatDatePH,
  formatPeso,
  PageContainer,
  PageHeader,
  Select,
} from "@ark/ui"
import { api } from "@data/api"
import {
  useAllOrders,
  useLiquidations,
  useReviewPoLiquidation,
  useSubmitPoLiquidation,
} from "@data/hooks"
import { groupLiquidationOrders, type LiquidationOrder } from "@data/liquidation-queue"
import type { Bank, PoLiquidation, PrAttachment, PurchaseOrder } from "@data/types"
import { createQuery } from "@tanstack/solid-query"
import { createMemo, createSignal, For, onMount, Show } from "solid-js"
import { QueryBoundary, StatusBadge } from "@/components/ui"

function ReadyCard(props: { item: LiquidationOrder }) {
  const mutation = useSubmitPoLiquidation()
  const previous = props.item.liquidation
  const [actualAmount, setActualAmount] = createSignal(
    previous?.status === "rejected" ? String(previous.actualAmount) : ""
  )
  const [varianceReason, setVarianceReason] = createSignal(
    previous?.status === "rejected" ? previous.varianceReason || "" : ""
  )
  const [receipts, setReceipts] = createSignal<PrAttachment[]>(
    previous?.status === "rejected" ? previous.receipts : []
  )
  const needsVarianceReason = () =>
    actualAmount() !== "" &&
    Math.abs(Number(props.item.po.totalAmount) - Number(actualAmount())) >= 0.005
  const canSubmit = () =>
    actualAmount() !== "" &&
    Number.isFinite(Number(actualAmount())) &&
    Number(actualAmount()) >= 0 &&
    receipts().length > 0 &&
    (!needsVarianceReason() || !!varianceReason().trim()) &&
    !mutation.isPending

  return (
    <article class="rounded-lg border border-border bg-surface p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="font-mono text-sm font-semibold text-foreground">{props.item.po.poCode}</p>
          <p class="mt-1 text-sm text-muted">
            {props.item.po.prCode || "PR not recorded"} ·{" "}
            {props.item.po.supplier || "Supplier not recorded"}
          </p>
          <Show when={props.item.po.batchName}>
            <p class="mt-1 text-xs text-muted">{props.item.po.batchName}</p>
          </Show>
        </div>
        <div class="text-right">
          <p class="text-xs text-muted">PO amount</p>
          <p class="font-semibold text-foreground">
            {formatPeso(Number(props.item.po.totalAmount))}
          </p>
          <a href={`/orders/${props.item.po.id}`} class="text-xs font-medium text-primary">
            Open PO
          </a>
        </div>
      </div>
      <Show when={previous?.status === "rejected"}>
        <p class="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">
          Finance rejected the previous submission
          {previous?.reviewNotes ? `: ${previous.reviewNotes}` : "."} Update the evidence and
          resubmit.
        </p>
      </Show>
      <details class="mt-4 border-t border-border pt-4">
        <summary class="cursor-pointer text-sm font-medium text-primary">
          Enter actual spending and receipts
        </summary>
        <form
          class="mt-4 space-y-4"
          onSubmit={event => {
            event.preventDefault()
            if (!canSubmit()) return
            mutation.mutate({
              poId: props.item.po.id,
              actualAmount: Number(actualAmount()),
              varianceReason: varianceReason().trim() || undefined,
              receipts: receipts(),
            })
          }}
        >
          <label class="block text-sm font-medium text-foreground">
            Actual amount spent
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={actualAmount()}
              onInput={event => setActualAmount(event.currentTarget.value)}
              class="mt-1 w-full rounded-lg border border-border px-3 py-2 font-normal"
            />
          </label>
          <Show when={needsVarianceReason()}>
            <label class="block text-sm font-medium text-foreground">
              Surplus / excess explanation
              <textarea
                required
                value={varianceReason()}
                onInput={event => setVarianceReason(event.currentTarget.value)}
                class="mt-1 w-full rounded-lg border border-border px-3 py-2 font-normal"
              />
            </label>
          </Show>
          <div>
            <p class="mb-2 text-sm font-medium text-foreground">Purchase receipts / return proof</p>
            <p class="mb-3 text-xs text-muted">
              Attach all receipts for actual spending. If nothing was spent, attach cancellation or
              return proof, as applicable.
            </p>
            <AttachmentUploader
              attachments={receipts()}
              onChange={setReceipts}
              signatureEndpoint="/api/procurement/upload-signature/attachment"
            />
          </div>
          <Show when={mutation.isError}>
            <p class="text-sm text-red-700">{mutation.error?.message}</p>
          </Show>
          <button
            type="submit"
            disabled={!canSubmit()}
            class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {mutation.isPending ? "Submitting…" : "Submit to Finance"}
          </button>
        </form>
      </details>
    </article>
  )
}

function UpcomingCard(props: { po: PurchaseOrder }) {
  return (
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
      <div>
        <p class="font-mono text-sm font-semibold">{props.po.poCode}</p>
        <p class="text-xs text-muted">
          {props.po.prCode || "PR not recorded"} · {props.po.supplier || "Supplier not recorded"}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <StatusBadge status={props.po.status} />
        <a href={`/orders/${props.po.id}`} class="text-sm font-medium text-primary">
          Open PO
        </a>
      </div>
    </div>
  )
}

function LiquidationCard(props: { liquidation: PoLiquidation; po: PurchaseOrder; banks: Bank[] }) {
  const mutation = useReviewPoLiquidation()
  const [bankId, setBankId] = createSignal("")
  const [notes, setNotes] = createSignal("")
  const liquidation = () => props.liquidation
  const po = () => props.po
  const requiresPaymentAccount = () => Number(liquidation().actualAmount) > 0

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
          <p class="text-xs text-muted">Evidence files</p>
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
          <Show
            when={requiresPaymentAccount()}
            fallback={
              <p class="self-center text-xs text-muted">₱0 spent — no payment account needed</p>
            }
          >
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
          </Show>
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
              disabled={(requiresPaymentAccount() && !bankId()) || mutation.isPending}
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
              {requiresPaymentAccount() ? "Approve & Post" : "Approve (no expense)"}
            </button>
          </div>
        </div>
      </Show>
    </article>
  )
}

export default function LiquidationPage() {
  const ordersQuery = useAllOrders()
  const liquidationsQuery = useLiquidations()
  const [search, setSearch] = createSignal("")
  onMount(() => setSearch(new URLSearchParams(window.location.search).get("search") || ""))
  const groups = createMemo(() => {
    const needle = search().trim().toLowerCase()
    const orders = (ordersQuery.data ?? []).filter(
      po =>
        !needle ||
        [po.poCode, po.prCode, po.supplier, po.batchName].some(value =>
          value?.toLowerCase().includes(needle)
        )
    )
    return groupLiquidationOrders(orders, liquidationsQuery.data ?? [])
  })
  const banksQuery = createQuery(() => ({
    queryKey: ["finance-banks"],
    queryFn: () => api<Bank[]>("/api/finance/banks"),
  }))
  return (
    <PageContainer>
      <PageHeader
        title="Finance / Liquidation"
        subtitle="Collect purchase receipts, submit actual PO spending, and review liquidations"
      />
      <div class="mb-6">
        <label for="liquidation-search" class="sr-only">
          Search purchase orders
        </label>
        <input
          id="liquidation-search"
          type="search"
          value={search()}
          onInput={event => setSearch(event.currentTarget.value)}
          placeholder="Search PO, PR, supplier, or batch"
          class="w-full max-w-md rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>
      <QueryBoundary query={ordersQuery}>
        {() => (
          <QueryBoundary query={liquidationsQuery}>
            {() => (
              <div class="space-y-8">
                <Show
                  when={
                    search().trim() && Object.values(groups()).every(items => items.length === 0)
                  }
                >
                  <p class="rounded-lg border border-dashed border-border p-6 text-sm text-muted">
                    No purchase orders match that search.
                  </p>
                </Show>
                <section>
                  <h2 class="mb-3 text-lg font-semibold text-foreground">
                    Ready to liquidate{" "}
                    <span class="text-sm font-normal text-muted">({groups().ready.length})</span>
                  </h2>
                  <Show
                    when={groups().ready.length > 0}
                    fallback={
                      !search().trim() && (
                        <p class="rounded-lg border border-dashed border-border p-6 text-sm text-muted">
                          No acknowledged POs are waiting for liquidation.
                        </p>
                      )
                    }
                  >
                    <div class="space-y-4">
                      <For each={groups().ready}>{item => <ReadyCard item={item} />}</For>
                    </div>
                  </Show>
                </section>
                <Show when={groups().inReview.length > 0}>
                  <section>
                    <h2 class="mb-3 text-lg font-semibold text-foreground">
                      Awaiting Finance review{" "}
                      <span class="text-sm font-normal text-muted">
                        ({groups().inReview.length})
                      </span>
                    </h2>
                    <div class="space-y-4">
                      <For each={groups().inReview}>
                        {item => (
                          <Show when={item.liquidation}>
                            {liquidation => (
                              <LiquidationCard
                                liquidation={liquidation()}
                                po={item.po}
                                banks={banksQuery.data ?? []}
                              />
                            )}
                          </Show>
                        )}
                      </For>
                    </div>
                  </section>
                </Show>
                <Show when={groups().upcoming.length > 0}>
                  <details open={Boolean(search().trim())}>
                    <summary class="mb-3 cursor-pointer text-lg font-semibold text-foreground">
                      Upcoming POs{" "}
                      <span class="text-sm font-normal text-muted">
                        ({groups().upcoming.length})
                      </span>
                    </summary>
                    <p class="mb-3 text-xs text-muted">
                      Confirm and acknowledge these POs before liquidation.
                    </p>
                    <div class="space-y-3">
                      <For each={groups().upcoming}>{item => <UpcomingCard po={item.po} />}</For>
                    </div>
                  </details>
                </Show>
                <Show when={groups().completed.length > 0}>
                  <details open={Boolean(search().trim())}>
                    <summary class="mb-3 cursor-pointer text-lg font-semibold text-foreground">
                      Completed{" "}
                      <span class="text-sm font-normal text-muted">
                        ({groups().completed.length})
                      </span>
                    </summary>
                    <div class="space-y-4">
                      <For each={groups().completed}>
                        {item => (
                          <Show
                            when={item.liquidation}
                            fallback={
                              <div>
                                <UpcomingCard po={item.po} />
                                <p class="mt-1 text-xs text-amber-700">
                                  No electronic liquidation or receipts are recorded for this PO.
                                </p>
                              </div>
                            }
                          >
                            {liquidation => (
                              <LiquidationCard
                                liquidation={liquidation()}
                                po={item.po}
                                banks={banksQuery.data ?? []}
                              />
                            )}
                          </Show>
                        )}
                      </For>
                    </div>
                  </details>
                </Show>
              </div>
            )}
          </QueryBoundary>
        )}
      </QueryBoundary>
    </PageContainer>
  )
}
