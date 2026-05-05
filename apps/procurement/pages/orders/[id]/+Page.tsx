import { useOrder } from "@data/hooks"
import type { PurchaseOrder } from "@data/types"
import { createMemo, createSignal, For, Show } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"
import { PoDocumentModal } from "@/components/po-document-modal"
import { Icons, PoStatusBadge, QueryBoundary } from "@/components/ui"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount)
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-"
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr))
}

export default function PoDetailPage() {
  const pageContext = usePageContext()
  const id = createMemo(() => pageContext.routeParams.id as string)
  const query = useOrder(id)
  const [documentModalOpen, setDocumentModalOpen] = createSignal(false)

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8">
      <div class="max-w-6xl mx-auto">
        {/* Back Link */}
        <a
          href="/orders"
          class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-6"
        >
          <Icons.arrowLeft class="w-4 h-4" /> Back to Orders
        </a>

        <QueryBoundary query={query}>
          {(p: PurchaseOrder) => (
            <>
              {/* Header */}
              <div class="flex items-start justify-between mb-8">
                <div>
                  <div class="flex items-center gap-3 mb-2">
                    <h1 class="text-2xl font-semibold text-gray-900">{(p as any).poCode}</h1>
                    <PoStatusBadge status={p.status} />
                  </div>
                  <p class="text-sm text-gray-600">{p.batchName}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDocumentModalOpen(true)}
                    class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Icons.fileText class="w-4 h-4" /> View PDF
                  </button>
                </div>
              </div>

              {/* Info Cards */}
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                  <p class="text-xs text-gray-500 mb-1">PR Reference</p>
                  <p class="text-sm font-mono text-gray-900">{p.prId}</p>
                </div>
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                  <p class="text-xs text-gray-500 mb-1">Supplier</p>
                  <p class="text-sm text-gray-900">{p.supplier}</p>
                </div>
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                  <p class="text-xs text-gray-500 mb-1">Total Amount</p>
                  <p class="text-sm text-gray-900">{formatCurrency(Number(p.totalAmount))}</p>
                </div>
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                  <p class="text-xs text-gray-500 mb-1">Created</p>
                  <p class="text-sm text-gray-900">{formatDate(p.createdAt)}</p>
                </div>
              </div>

              {/* Details Section */}
              <div class="bg-white rounded-lg border border-gray-200 mb-8">
                <div class="px-6 py-4 border-b border-gray-100">
                  <h2 class="text-lg font-semibold text-gray-900">Order Details</h2>
                </div>
                <div class="divide-y divide-gray-100">
                  <div class="flex py-4 px-6">
                    <span class="w-40 text-sm text-gray-500">Batch</span>
                    <span class="text-sm text-gray-900">{p.batchName}</span>
                  </div>
                  <Show when={p.notes}>
                    <div class="flex py-4 px-6">
                      <span class="w-40 text-sm text-gray-500">Notes</span>
                      <span class="text-sm text-gray-900 flex-1">{p.notes}</span>
                    </div>
                  </Show>
                </div>
              </div>

              {/* Items Table */}
              <div class="bg-white rounded-lg border border-gray-200 mb-8">
                <div class="px-6 py-4 border-b border-gray-100">
                  <h2 class="text-lg font-semibold text-gray-900">
                    Items ({(p.items as Array<any>).length})
                  </h2>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead class="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th class="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Item
                        </th>
                        <th class="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Qty
                        </th>
                        <th class="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Unit
                        </th>
                        <th class="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th class="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={p.items as Array<any>}>
                        {item => (
                          <tr class="border-t border-gray-100">
                            <td class="py-4 px-6 text-sm text-gray-900">{item.name}</td>
                            <td class="py-4 px-6 text-sm text-gray-900">{item.quantity}</td>
                            <td class="py-4 px-6 text-sm text-gray-600">{item.unit}</td>
                            <td class="py-4 px-6 text-sm text-gray-900 text-right">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td class="py-4 px-6 text-sm text-gray-900 text-right">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                    <tfoot class="border-t border-gray-200">
                      <tr>
                        <td
                          colSpan={4}
                          class="py-4 px-6 text-right text-sm font-medium text-gray-900"
                        >
                          Grand Total
                        </td>
                        <td class="py-4 px-6 text-right text-base text-gray-900">
                          {formatCurrency(Number(p.totalAmount))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Delivery Section */}
              <div class="bg-white rounded-lg border border-gray-200">
                <div class="px-6 py-4 border-b border-gray-100">
                  <h2 class="text-lg font-semibold text-gray-900">Delivery</h2>
                </div>
                <div class="divide-y divide-gray-100">
                  <div class="flex py-4 px-6">
                    <span class="w-40 text-sm text-gray-500">Status</span>
                    <PoStatusBadge status={p.status} />
                  </div>
                  <div class="flex py-4 px-6">
                    <span class="w-40 text-sm text-gray-500">Est. Delivery</span>
                    <span class="text-sm text-gray-900">{formatDate(p.estimatedDelivery)}</span>
                  </div>
                  <Show when={p.actualDelivery}>
                    <div class="flex py-4 px-6">
                      <span class="w-40 text-sm text-gray-500">Actual Delivery</span>
                      <span class="text-sm text-gray-900">{formatDate(p.actualDelivery)}</span>
                    </div>
                  </Show>
                </div>
              </div>

              {/* Document Modal */}
              <PoDocumentModal
                open={documentModalOpen()}
                onClose={() => setDocumentModalOpen(false)}
                po={p}
              />
            </>
          )}
        </QueryBoundary>
      </div>
    </div>
  )
}
