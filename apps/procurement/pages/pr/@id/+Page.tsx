import { formatDatePH, formatPeso, PageContainer } from "@ark/ui"
import { useRequest } from "@data/hooks"
import type { PurchaseRequest } from "@data/types"
import { createMemo, createSignal, For, Show } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"
import { PrDocumentModal } from "@/components/pr-document-modal"
import { Icons, PrStatusBadge, QueryBoundary } from "@/components/ui"

export default function PrDetailPage() {
  const pageContext = usePageContext()
  const id = createMemo(() => pageContext.routeParams.id as string)
  const query = useRequest(id)
  const [documentModalOpen, setDocumentModalOpen] = createSignal(false)

  return (
    <PageContainer>
      <a
        href="/"
        class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary mb-6"
      >
        <Icons.arrowLeft class="w-4 h-4" /> Back to Requests
      </a>

      <QueryBoundary query={query}>
        {(p: PurchaseRequest) => (
          <>
            <div class="flex items-start justify-between mb-8">
              <div>
                <div class="flex items-center gap-3 mb-2">
                  <h1 class="text-2xl font-semibold text-foreground">{p.prCode}</h1>
                  <PrStatusBadge status={p.status} />
                </div>
                <p class="text-sm text-muted">{p.batchName}</p>
              </div>
              <div class="flex items-center gap-2">
                <Show when={p.status === "pending"}>
                  <a
                    href={`/pr/${p.id}/edit`}
                    class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted transition-colors"
                  >
                    <Icons.edit class="w-4 h-4" /> Edit
                  </a>
                </Show>
                <Show when={p.status === "approved"}>
                  <a
                    href={`/orders/create?prId=${p.id}`}
                    class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Create PO
                  </a>
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

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div class="bg-surface rounded-lg border border-border p-4">
                <p class="text-xs text-muted mb-1">Category</p>
                <Show when={p.category} fallback={<p class="text-sm text-muted">—</p>}>
                  <span class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                    {p.category}
                  </span>
                </Show>
              </div>
              <div class="bg-surface rounded-lg border border-border p-4">
                <p class="text-xs text-muted mb-1">Total Amount</p>
                <p class="text-sm text-foreground">{formatPeso(Number(p.totalAmount))}</p>
              </div>
              <div class="bg-surface rounded-lg border border-border p-4">
                <p class="text-xs text-muted mb-1">Created</p>
                <p class="text-sm text-foreground">{formatDatePH(p.createdAt)}</p>
              </div>
              <div class="bg-surface rounded-lg border border-border p-4">
                <p class="text-xs text-muted mb-1">Created By</p>
                <p class="text-sm text-foreground">{p.createdBy}</p>
              </div>
            </div>

            <div class="bg-surface rounded-lg border border-border mb-8">
              <div class="px-6 py-4 border-b border-border">
                <h2 class="text-lg font-semibold text-foreground">Request Details</h2>
              </div>
              <div class="divide-y divide-border">
                <div class="flex py-4 px-6">
                  <span class="w-40 text-sm text-muted">Batch Code</span>
                  <span class="text-sm text-foreground">{p.batchCode}</span>
                </div>
                <div class="flex py-4 px-6">
                  <span class="w-40 text-sm text-muted">Purpose</span>
                  <span class="text-sm text-foreground flex-1">{p.purpose}</span>
                </div>
              </div>
            </div>

            <div class="bg-surface rounded-lg border border-border mb-8">
              <div class="px-6 py-4 border-b border-border">
                <h2 class="text-lg font-semibold text-foreground">Items ({p.items.length})</h2>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-surface-muted border-b border-border">
                    <tr>
                      <th class="text-left py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wider">
                        Item
                      </th>
                      <th class="text-left py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wider">
                        Qty
                      </th>
                      <th class="text-left py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wider">
                        Unit
                      </th>
                      <th class="text-right py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th class="text-right py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
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

            <Show when={p.attachments && p.attachments.length > 0}>
              <div class="bg-surface rounded-lg border border-border mb-8">
                <div class="px-6 py-4 border-b border-border">
                  <h2 class="text-lg font-semibold text-foreground">
                    Attachments ({p.attachments?.length ?? 0})
                  </h2>
                </div>
                <ul class="divide-y divide-border">
                  <For each={p.attachments ?? []}>
                    {att => (
                      <li class="flex items-center gap-2 px-6 py-3">
                        <Icons.fileText class="w-4 h-4 text-muted flex-shrink-0" />
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="flex-1 text-sm text-foreground hover:text-primary truncate"
                          title={att.name}
                        >
                          {att.name}
                        </a>
                        <Show when={att.size}>
                          <span class="text-xs text-muted flex-shrink-0">
                            {((att.size ?? 0) / 1024).toFixed(0)} KB
                          </span>
                        </Show>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            </Show>

            <Show when={p.status !== "pending"}>
              <div class="bg-surface rounded-lg border border-border">
                <div class="px-6 py-4 border-b border-border">
                  <h2 class="text-lg font-semibold text-foreground">Approval</h2>
                </div>
                <div class="divide-y divide-border">
                  <div class="flex py-4 px-6">
                    <span class="w-40 text-sm text-muted">Status</span>
                    <PrStatusBadge status={p.status} />
                  </div>
                  <Show when={p.approvedBy}>
                    <div class="flex py-4 px-6">
                      <span class="w-40 text-sm text-muted">Approved By</span>
                      <span class="text-sm text-foreground">{p.approvedBy}</span>
                    </div>
                  </Show>
                  <Show when={p.approvedAt}>
                    {approvedAt => (
                      <div class="flex py-4 px-6">
                        <span class="w-40 text-sm text-muted">Date</span>
                        <span class="text-sm text-foreground">{formatDatePH(approvedAt())}</span>
                      </div>
                    )}
                  </Show>
                  <Show when={p.approvalNotes}>
                    <div class="flex py-4 px-6">
                      <span class="w-40 text-sm text-muted">Notes</span>
                      <span class="text-sm text-foreground flex-1">{p.approvalNotes}</span>
                    </div>
                  </Show>
                </div>
              </div>
            </Show>

            <PrDocumentModal
              open={documentModalOpen()}
              onClose={() => setDocumentModalOpen(false)}
              pr={p}
            />
          </>
        )}
      </QueryBoundary>
    </PageContainer>
  )
}
