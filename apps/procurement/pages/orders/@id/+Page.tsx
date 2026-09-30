import {
  BackLink,
  formatDatePH,
  formatPeso,
  InfoCard,
  PageContainer,
  PageHeader,
  THead,
  Th,
} from "@ark/ui"
import { useAcknowledgePo, useConfirmPo, useOrder } from "@data/hooks"
import type { PurchaseOrder } from "@data/types"
import { createMemo, createSignal, For, Show } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"
import { EditPoModal } from "@/components/edit-po-modal"
import { PoDocumentModal } from "@/components/po-document-modal"
import { SignaturePad } from "@/components/signature-pad"
import { Icons, QueryBoundary, StatusBadge } from "@/components/ui"

export default function PoDetailPage() {
  const pageContext = usePageContext()
  const id = createMemo(() => pageContext.routeParams.id as string)
  const query = useOrder(id)
  const confirmMutation = useConfirmPo()
  const acknowledgeMutation = useAcknowledgePo()
  const [documentModalOpen, setDocumentModalOpen] = createSignal(false)
  const [editModalOpen, setEditModalOpen] = createSignal(false)
  const [recipientName, setRecipientName] = createSignal("")
  const [signatureUrl, setSignatureUrl] = createSignal("")
  const [acknowledgmentNotes, setAcknowledgmentNotes] = createSignal("")

  return (
    <PageContainer>
      <div class="mb-6">
        <BackLink href="/orders">Back to Purchase Orders</BackLink>
      </div>
      <QueryBoundary query={query}>
        {(po: PurchaseOrder) => (
          <>
            <PageHeader
              title={po.poCode}
              badge={<StatusBadge status={po.status} />}
              subtitle={po.batchName || "Company expense"}
              action={
                <div class="flex flex-wrap items-center gap-2">
                  <Show when={po.status === "pending"}>
                    <button
                      type="button"
                      onClick={() => setEditModalOpen(true)}
                      class="rounded-lg border border-border px-4 py-2 text-sm font-medium"
                    >
                      <Icons.edit class="mr-2 inline h-4 w-4" /> Edit details
                    </button>
                    <button
                      type="button"
                      disabled={confirmMutation.isPending}
                      onClick={() => confirmMutation.mutate({ id: po.id })}
                      class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      Confirm PO
                    </button>
                  </Show>
                  <button
                    type="button"
                    onClick={() => setDocumentModalOpen(true)}
                    class="rounded-lg border border-border px-4 py-2 text-sm font-medium"
                  >
                    <Icons.fileText class="mr-2 inline h-4 w-4" /> View PDF
                  </button>
                </div>
              }
            />

            <div class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <InfoCard label="PR Reference" mono value={po.prCode ?? po.prId} />
              <InfoCard label="Supplier" value={po.supplier || "Not set"} />
              <InfoCard label="PO Amount" value={formatPeso(Number(po.totalAmount))} />
              <InfoCard label="Created" value={formatDatePH(po.createdAt)} />
            </div>

            <div class="mb-8 overflow-hidden rounded-lg border border-border bg-surface">
              <div class="border-b border-border px-6 py-4">
                <h2 class="text-lg font-semibold">PO Items</h2>
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
                    <For each={po.items}>
                      {item => (
                        <tr class="border-t border-border">
                          <td class="px-6 py-4 text-sm">{item.name}</td>
                          <td class="px-6 py-4 text-sm">{item.quantity}</td>
                          <td class="px-6 py-4 text-sm text-muted">{item.unit}</td>
                          <td class="px-6 py-4 text-right text-sm">{formatPeso(item.unitPrice)}</td>
                          <td class="px-6 py-4 text-right text-sm">{formatPeso(item.total)}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </div>

            <Show when={po.status === "confirmed"}>
              <form
                class="mb-8 space-y-4 rounded-lg border border-border bg-surface p-6"
                onSubmit={event => {
                  event.preventDefault()
                  acknowledgeMutation.mutate({
                    id: po.id,
                    body: {
                      recipientName: recipientName(),
                      recipientSignatureUrl: signatureUrl(),
                      notes: acknowledgmentNotes() || undefined,
                    },
                  })
                }}
              >
                <div>
                  <h2 class="text-lg font-semibold">Acknowledge Receipt</h2>
                  <p class="text-sm text-muted">Record the recipient and their drawn signature.</p>
                </div>
                <label class="block text-sm font-medium">
                  Recipient name
                  <input
                    required
                    value={recipientName()}
                    onInput={event => setRecipientName(event.currentTarget.value)}
                    class="mt-1 w-full rounded-lg border border-border px-3 py-2 font-normal"
                  />
                </label>
                <SignaturePad onUploaded={setSignatureUrl} />
                <Show when={signatureUrl()}>
                  <p class="text-xs text-green-700">Signature saved and ready.</p>
                </Show>
                <textarea
                  value={acknowledgmentNotes()}
                  onInput={event => setAcknowledgmentNotes(event.currentTarget.value)}
                  placeholder="Acknowledgment notes (optional)"
                  class="w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={!recipientName() || !signatureUrl() || acknowledgeMutation.isPending}
                  class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Acknowledge PO
                </button>
              </form>
            </Show>

            <Show when={po.status === "acknowledged"}>
              <div class="rounded-lg border border-border bg-surface p-6">
                <h2 class="text-lg font-semibold">Ready for liquidation</h2>
                <p class="mt-1 text-sm text-muted">
                  Enter actual spending and upload purchase receipts in Finance / Liquidation.
                </p>
                <a
                  href={`/liquidation?search=${encodeURIComponent(po.poCode)}`}
                  class="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                >
                  Open Finance / Liquidation
                </a>
              </div>
            </Show>

            <Show when={po.status === "liquidated"}>
              <div class="rounded-lg border border-green-200 bg-green-50 p-5 text-sm text-green-800">
                Finance approved this liquidation. Its actual amount is posted as an immutable
                expense.
              </div>
            </Show>

            <PoDocumentModal
              open={documentModalOpen()}
              onClose={() => setDocumentModalOpen(false)}
              po={po}
            />
            <EditPoModal open={editModalOpen()} onClose={() => setEditModalOpen(false)} po={po} />
          </>
        )}
      </QueryBoundary>
    </PageContainer>
  )
}
