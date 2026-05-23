import type { Asset, AssetStatus, PrAttachment } from "@ark/data-types"
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
import { useAsset, useDisposeAsset } from "@data/hooks"
import { createMemo, createSignal, For, Show } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"
import { bookValueAt, depreciationSchedule, monthsElapsedSince } from "../_lib.ts"

export default function AssetDetailPage() {
  const ctx = usePageContext()
  const id = createMemo(() => ctx.routeParams.id as string)
  const query = useAsset(id)
  const dispose = useDisposeAsset()

  const [disposeOpen, setDisposeOpen] = createSignal(false)
  const [disposalDate, setDisposalDate] = createSignal(new Date().toISOString().slice(0, 10))
  const [disposalProceeds, setDisposalProceeds] = createSignal("0")
  const [disposeNotes, setDisposeNotes] = createSignal("")

  const submitDispose = () => {
    const id_ = query.data?.id
    if (!id_) return
    dispose.mutate(
      {
        id: id_,
        disposalDate: disposalDate(),
        disposalProceeds: (Number.parseFloat(disposalProceeds()) || 0).toFixed(2),
        notes: disposeNotes().trim() || undefined,
      },
      { onSuccess: () => setDisposeOpen(false) }
    )
  }

  return (
    <PageContainer>
      <div class="mb-6">
        <BackLink href="/assets">Back to assets</BackLink>
      </div>

      <Show
        when={query.data}
        keyed
        fallback={
          <div class="py-16 text-center text-sm text-muted">
            <Show when={query.isPending}>Loading…</Show>
            <Show when={query.isError}>Could not load this asset.</Show>
          </div>
        }
      >
        {assetData => {
          const asset = assetData as Asset
          const schedule = depreciationSchedule(asset)
          const elapsed = monthsElapsedSince(asset.acquisitionDate)
          const elapsedClamped = Math.min(elapsed, asset.usefulLifeMonths)
          const bookValue = bookValueAt(asset, new Date())
          const accumulated = Number(asset.acquisitionCost) - bookValue
          const monthly = schedule[0]?.depreciation ?? 0

          return (
            <>
              <PageHeader
                title={asset.assetCode}
                badge={<StatusBadge status={asset.status as AssetStatus} />}
                subtitle={asset.name}
                action={
                  <Show when={asset.status === "active"}>
                    <button
                      type="button"
                      onClick={() => setDisposeOpen(true)}
                      class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted"
                    >
                      <Icons.trash class="w-4 h-4" /> Dispose
                    </button>
                  </Show>
                }
              />

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <InfoCard label="Category" value={asset.category} />
                <InfoCard
                  label="Acquired"
                  value={`${formatDatePH(asset.acquisitionDate)} (${elapsedClamped}/${asset.usefulLifeMonths}mo)`}
                />
                <InfoCard label="Cost" value={formatPeso(Number(asset.acquisitionCost))} />
                <InfoCard
                  label="Book value"
                  value={asset.status === "active" ? formatPeso(bookValue) : "—"}
                />
                <InfoCard label="Residual" value={formatPeso(Number(asset.residualValue))} />
                <InfoCard label="Monthly dep." value={formatPeso(monthly)} />
                <InfoCard label="Accumulated dep." value={formatPeso(accumulated)} />
                <InfoCard label="Profit center" value={asset.profitCenter ?? "—"} />
                <InfoCard label="Assigned to" value={asset.assignedTo ?? "—"} />
                <InfoCard label="Location" value={asset.location ?? "—"} />
                <InfoCard label="Serial #" value={asset.serialNo ?? "—"} mono />
                <InfoCard label="Linked PR" value={asset.linkedPrCode ?? "—"} mono />
              </div>

              <Show when={asset.status === "disposed" && asset.disposalDate}>
                <div class="bg-surface rounded-lg border border-border p-6 mb-8">
                  <h2 class="text-lg font-semibold text-foreground mb-3">Disposal</h2>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p class="text-muted text-xs">Disposed on</p>
                      <p class="text-foreground">{formatDatePH(asset.disposalDate ?? "")}</p>
                    </div>
                    <div>
                      <p class="text-muted text-xs">Proceeds</p>
                      <p class="text-foreground">
                        {asset.disposalProceeds ? formatPeso(Number(asset.disposalProceeds)) : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </Show>

              <Show when={asset.description || asset.notes}>
                <div class="bg-surface rounded-lg border border-border p-6 mb-8 space-y-3">
                  <Show when={asset.description}>
                    <div>
                      <h3 class="text-sm font-semibold text-foreground mb-1">Description</h3>
                      <p class="text-sm text-muted whitespace-pre-wrap">{asset.description}</p>
                    </div>
                  </Show>
                  <Show when={asset.notes}>
                    <div>
                      <h3 class="text-sm font-semibold text-foreground mb-1">Notes</h3>
                      <p class="text-sm text-muted whitespace-pre-wrap">{asset.notes}</p>
                    </div>
                  </Show>
                </div>
              </Show>

              <Show when={(asset.attachments ?? []).length > 0}>
                <div class="bg-surface rounded-lg border border-border p-6 mb-8">
                  <h2 class="text-lg font-semibold text-foreground mb-3">Attachments</h2>
                  <ul class="space-y-1.5">
                    <For each={asset.attachments as PrAttachment[]}>
                      {att => (
                        <li class="flex items-center gap-2 px-3 py-2 bg-surface-muted rounded-lg border border-border">
                          <Icons.fileText class="w-4 h-4 text-muted flex-shrink-0" />
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-sm text-foreground hover:text-primary"
                          >
                            {att.name}
                          </a>
                        </li>
                      )}
                    </For>
                  </ul>
                </div>
              </Show>

              <div class="bg-surface rounded-lg border border-border overflow-hidden mb-8">
                <div class="px-6 py-4 border-b border-border">
                  <h2 class="text-lg font-semibold text-foreground">Depreciation Schedule</h2>
                  <p class="text-xs text-muted mt-0.5">
                    Straight-line. {schedule.length} months until fully depreciated.
                  </p>
                </div>
                <div class="overflow-x-auto max-h-[480px]">
                  <table class="w-full">
                    <THead>
                      <Th size="dense">Month</Th>
                      <Th size="dense">Period</Th>
                      <Th size="dense" align="right">
                        Depreciation
                      </Th>
                      <Th size="dense" align="right">
                        Accumulated
                      </Th>
                      <Th size="dense" align="right">
                        Book value
                      </Th>
                    </THead>
                    <tbody>
                      <For each={schedule}>
                        {p => {
                          const isPast = p.date <= new Date()
                          return (
                            <tr
                              class={`border-t border-border ${isPast ? "bg-surface-muted/30" : ""}`}
                            >
                              <td class="py-2 px-6 text-sm text-muted tabular-nums">
                                {p.monthIndex}
                              </td>
                              <td class="py-2 px-6 text-sm text-foreground">
                                {p.date.toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                })}
                              </td>
                              <td class="py-2 px-6 text-right text-sm text-foreground tabular-nums">
                                {formatPeso(p.depreciation)}
                              </td>
                              <td class="py-2 px-6 text-right text-sm text-muted tabular-nums">
                                {formatPeso(p.accumulated)}
                              </td>
                              <td class="py-2 px-6 text-right text-sm font-medium text-foreground tabular-nums">
                                {formatPeso(p.bookValue)}
                              </td>
                            </tr>
                          )
                        }}
                      </For>
                    </tbody>
                  </table>
                </div>
              </div>

              <Show when={disposeOpen()}>
                <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                  <div class="bg-surface rounded-lg border border-border w-full max-w-md p-6 space-y-4">
                    <h2 class="text-lg font-semibold text-foreground">Dispose Asset</h2>
                    <p class="text-sm text-muted">
                      Marks the asset as disposed. Depreciation stops on the disposal date.
                    </p>
                    <label class="block">
                      <span class="block text-sm font-medium text-foreground mb-1">
                        Disposal date
                      </span>
                      <input
                        type="date"
                        value={disposalDate()}
                        onInput={e => setDisposalDate(e.currentTarget.value)}
                        class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                      />
                    </label>
                    <label class="block">
                      <span class="block text-sm font-medium text-foreground mb-1">
                        Proceeds (PHP, optional)
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={disposalProceeds()}
                        onInput={e => setDisposalProceeds(e.currentTarget.value)}
                        class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                      />
                    </label>
                    <label class="block">
                      <span class="block text-sm font-medium text-foreground mb-1">
                        Notes (optional)
                      </span>
                      <textarea
                        rows={2}
                        value={disposeNotes()}
                        onInput={e => setDisposeNotes(e.currentTarget.value)}
                        class="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none"
                      />
                    </label>
                    <div class="flex justify-end gap-2 pt-2 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setDisposeOpen(false)}
                        class="px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={submitDispose}
                        disabled={dispose.isPending}
                        class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg disabled:opacity-50"
                      >
                        {dispose.isPending ? "Disposing…" : "Dispose"}
                      </button>
                    </div>
                  </div>
                </div>
              </Show>
            </>
          )
        }}
      </Show>
    </PageContainer>
  )
}
