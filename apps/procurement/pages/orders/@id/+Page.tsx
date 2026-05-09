import { BackLink, formatDatePH, formatPeso, InfoCard, PageContainer, THead, Th } from "@ark/ui"
import { api } from "@data/api"
import { useOrder } from "@data/hooks"
import { queryKeys } from "@data/query-keys"
import type { PurchaseOrder } from "@data/types"
import { createQuery } from "@tanstack/solid-query"
import { createMemo, createSignal, For, Show } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"
import { EditPoModal } from "@/components/edit-po-modal"
import { PoDocumentModal } from "@/components/po-document-modal"
import { Icons, QueryBoundary, StatusBadge } from "@/components/ui"

interface ReceiptMovement {
  id: string
  itemName: string
  quantity: number
  type: "in" | "out" | "adjustment"
  reference?: string
  reason?: string
  createdAt: string
  createdBy?: string
}

export default function PoDetailPage() {
  const pageContext = usePageContext()
  const id = createMemo(() => pageContext.routeParams.id as string)
  const query = useOrder(id)
  const [documentModalOpen, setDocumentModalOpen] = createSignal(false)
  const [editModalOpen, setEditModalOpen] = createSignal(false)

  return (
    <PageContainer>
      {/* Back Link */}
      <div class="mb-6">
        <BackLink href="/orders">Back to Orders</BackLink>
      </div>

      <QueryBoundary query={query}>
        {(p: PurchaseOrder) => {
          const receiptsQuery = createQuery(() => ({
            queryKey: queryKeys.receipts.byPoCode(p.poCode),
            queryFn: () =>
              api<ReceiptMovement[]>(
                `/api/inventory/movements?reference=${encodeURIComponent(p.poCode)}`
              ),
            enabled: !!p.poCode,
          }))
          const receipts = () => receiptsQuery.data ?? []
          const totalReceived = () => receipts().reduce((sum, r) => sum + r.quantity, 0)
          return (
            <>
              {/* Header */}
              <div class="flex items-start justify-between mb-8">
                <div>
                  <div class="flex items-center gap-3 mb-2">
                    <h1 class="text-2xl font-semibold text-foreground">{p.poCode}</h1>
                    <StatusBadge status={p.status} />
                  </div>
                  <p class="text-sm text-muted">{p.batchName}</p>
                </div>
                <div class="flex items-center gap-2">
                  <Show when={p.status !== "received" && p.status !== "cancelled"}>
                    <button
                      type="button"
                      onClick={() => setEditModalOpen(true)}
                      class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted transition-colors"
                    >
                      <Icons.edit class="w-4 h-4" /> Edit
                    </button>
                  </Show>
                  <button
                    type="button"
                    onClick={() => setDocumentModalOpen(true)}
                    class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted transition-colors"
                  >
                    <Icons.fileText class="w-4 h-4" /> View PDF
                  </button>
                </div>
              </div>

              {/* Info Cards */}
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <InfoCard label="PR Reference" mono value={p.prId} />
                <InfoCard label="Supplier" value={p.supplier} />
                <InfoCard label="Total Amount" value={formatPeso(Number(p.totalAmount))} />
                <InfoCard label="Created" value={formatDatePH(p.createdAt)} />
              </div>

              {/* Details Section */}
              <div class="bg-surface rounded-lg border border-border mb-8">
                <div class="px-6 py-4 border-b border-border">
                  <h2 class="text-lg font-semibold text-foreground">Order Details</h2>
                </div>
                <div class="divide-y divide-border">
                  <div class="flex py-4 px-6">
                    <span class="w-40 text-sm text-muted">Batch</span>
                    <span class="text-sm text-foreground">{p.batchName}</span>
                  </div>
                  <Show when={p.notes}>
                    <div class="flex py-4 px-6">
                      <span class="w-40 text-sm text-muted">Notes</span>
                      <span class="text-sm text-foreground flex-1">{p.notes}</span>
                    </div>
                  </Show>
                </div>
              </div>

              {/* Items Table */}
              <div class="bg-surface rounded-lg border border-border mb-8">
                <div class="px-6 py-4 border-b border-border">
                  <h2 class="text-lg font-semibold text-foreground">Items ({p.items.length})</h2>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <THead>
                      <Th>Item</Th>
                      <Th>Qty</Th>
                      <Th>Unit</Th>
                      <Th align="right">Unit Price</Th>
                      <Th align="right">Total</Th>
                    </THead>
                    <tbody>
                      <For each={p.items}>
                        {item => (
                          <tr class="border-t border-border">
                            <td class="py-4 px-6 text-sm text-foreground">{item.name}</td>
                            <td class="py-4 px-6 text-sm text-foreground">{item.quantity}</td>
                            <td class="py-4 px-6 text-sm text-muted">{item.unit}</td>
                            <td class="py-4 px-6 text-sm text-foreground text-right">
                              {formatPeso(item.unitPrice)}
                            </td>
                            <td class="py-4 px-6 text-sm text-foreground text-right">
                              {formatPeso(item.total)}
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                    <tfoot class="border-t border-border">
                      <tr>
                        <td
                          colSpan={4}
                          class="py-4 px-6 text-right text-sm font-medium text-foreground"
                        >
                          Grand Total
                        </td>
                        <td class="py-4 px-6 text-right text-base text-foreground">
                          {formatPeso(Number(p.totalAmount))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Delivery Section */}
              <div class="bg-surface rounded-lg border border-border mb-8">
                <div class="px-6 py-4 border-b border-border">
                  <h2 class="text-lg font-semibold text-foreground">Delivery</h2>
                </div>
                <div class="divide-y divide-border">
                  <div class="flex py-4 px-6">
                    <span class="w-40 text-sm text-muted">Status</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div class="flex py-4 px-6">
                    <span class="w-40 text-sm text-muted">Est. Delivery</span>
                    <span class="text-sm text-foreground">{formatDatePH(p.estimatedDelivery)}</span>
                  </div>
                  <Show when={p.actualDelivery}>
                    <div class="flex py-4 px-6">
                      <span class="w-40 text-sm text-muted">Actual Delivery</span>
                      <span class="text-sm text-foreground">{formatDatePH(p.actualDelivery)}</span>
                    </div>
                  </Show>
                </div>
              </div>

              {/* Receipts — stock movements written when this PO was received */}
              <Show when={receipts().length > 0}>
                <div class="bg-surface rounded-lg border border-border">
                  <div class="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div>
                      <h2 class="text-lg font-semibold text-foreground">Receipts</h2>
                      <p class="text-xs text-muted mt-0.5">
                        Stock movements logged when this PO was received into inventory.
                      </p>
                    </div>
                    <span class="text-sm text-muted">
                      Total received:{" "}
                      <span class="font-semibold text-foreground">{totalReceived()}</span>
                    </span>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full">
                      <THead>
                        <Th>Date</Th>
                        <Th>Item</Th>
                        <Th align="right">Qty</Th>
                        <Th>Recorded by</Th>
                      </THead>
                      <tbody>
                        <For each={receipts()}>
                          {r => (
                            <tr class="border-t border-border">
                              <td class="py-3 px-6 text-sm text-muted whitespace-nowrap">
                                {formatDatePH(r.createdAt)}
                              </td>
                              <td class="py-3 px-6 text-sm text-foreground">{r.itemName}</td>
                              <td class="py-3 px-6 text-sm text-right text-foreground tabular-nums">
                                +{r.quantity}
                              </td>
                              <td class="py-3 px-6 text-sm text-muted">{r.createdBy ?? "—"}</td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </div>
              </Show>

              {/* Document Modal */}
              <PoDocumentModal
                open={documentModalOpen()}
                onClose={() => setDocumentModalOpen(false)}
                po={p}
              />

              {/* Edit Modal */}
              <EditPoModal open={editModalOpen()} onClose={() => setEditModalOpen(false)} po={p} />
            </>
          )
        }}
      </QueryBoundary>
    </PageContainer>
  )
}
