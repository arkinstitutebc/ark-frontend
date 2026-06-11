import {
  Button,
  DataTable,
  formatDatePH,
  formatPeso,
  Icons,
  PageHeader,
  QueryBoundary,
  Select,
  StatCard,
  StatusBadge,
  THead,
  Th,
  Tr,
} from "@ark/ui"
import { API_URL } from "@data/api"
import { useCheckVouchers } from "@data/hooks"
import type { CheckVoucherStatus } from "@data/types"
import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { navigate } from "vike/client/router"

const PAGE_SIZE = 20

const statusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Prepared", value: "prepared" },
  { label: "Approved", value: "approved" },
  { label: "Paid", value: "paid" },
  { label: "Void", value: "void" },
]

function VoucherTh(props: {
  children: import("solid-js").JSX.Element
  align?: "left" | "right" | "center"
  class?: string
}) {
  return (
    <Th align={props.align} class={`${props.class ?? ""} sticky top-0 z-10 bg-surface-muted`}>
      {props.children}
    </Th>
  )
}

export default function CheckVouchersPage() {
  const [search, setSearch] = createSignal("")
  const [status, setStatus] = createSignal<CheckVoucherStatus | "all">("all")
  const [page, setPage] = createSignal(1)

  const query = useCheckVouchers(() => ({
    page: page(),
    limit: PAGE_SIZE,
    search: search().trim() || undefined,
    status: status(),
  }))

  const totalPages = createMemo(() => Math.max(1, Math.ceil((query.data?.total ?? 0) / PAGE_SIZE)))
  const showingFrom = createMemo(() => (!query.data?.total ? 0 : (page() - 1) * PAGE_SIZE + 1))
  const showingTo = createMemo(() =>
    Math.min((page() - 1) * PAGE_SIZE + (query.data?.items.length ?? 0), query.data?.total ?? 0)
  )
  const hasFilter = createMemo(() => search().trim().length > 0 || status() !== "all")

  createEffect(() => {
    search()
    status()
    setPage(1)
  })

  createEffect(() => {
    if (page() > totalPages()) setPage(totalPages())
  })

  return (
    <div class="mx-auto max-w-[1600px] px-6 py-8 sm:px-8 lg:px-12">
      <PageHeader
        title="Check Vouchers"
        subtitle="Standalone payment vouchers with debit and credit lines"
        action={
          <Button type="button" size="sm" onClick={() => navigate("/check-vouchers/create")}>
            <Icons.plus class="h-4 w-4" />
            New Voucher
          </Button>
        }
      />

      <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Vouchers" numeric value={query.data?.total ?? "-"} />
        <StatCard
          label="Pending"
          numeric
          value={query.data?.items.filter(v => v.status !== "paid").length ?? "-"}
        />
        <StatCard label="Total Amount" numeric value={formatPeso(query.data?.totalAmount ?? 0)} />
      </div>

      <section class="overflow-hidden rounded-lg border border-border bg-surface">
        <div class="space-y-3 border-b border-border px-5 py-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-sm font-semibold text-foreground">Voucher Register</h2>
              <p class="mt-1 text-xs text-muted">Real check voucher documents only.</p>
            </div>
            <div class="grid gap-3 sm:grid-cols-[280px_150px]">
              <input
                type="search"
                value={search()}
                onInput={e => setSearch(e.currentTarget.value)}
                placeholder="Search voucher, payee, check no."
                class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Select
                value={status()}
                onChange={value => setStatus(value as CheckVoucherStatus | "all")}
                options={statusOptions}
                ariaLabel="Voucher status"
              />
            </div>
          </div>
        </div>

        <QueryBoundary query={query}>
          {data => (
            <Show
              when={data.items.length > 0}
              fallback={
                <div class="py-12 text-center">
                  <Icons.fileText class="mx-auto mb-3 h-12 w-12 text-muted" />
                  <p class="text-sm font-medium text-foreground">
                    {hasFilter() ? "No matching check vouchers" : "No check vouchers yet"}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    class="mt-4"
                    onClick={() => navigate("/check-vouchers/create")}
                  >
                    Create Voucher
                  </Button>
                </div>
              }
            >
              <DataTable class="max-h-[600px] overflow-auto">
                <THead>
                  <VoucherTh class="min-w-[150px]">Voucher</VoucherTh>
                  <VoucherTh class="min-w-[120px]">Date</VoucherTh>
                  <VoucherTh class="min-w-[190px]">Payee</VoucherTh>
                  <VoucherTh class="min-w-[280px]">Particular</VoucherTh>
                  <VoucherTh class="min-w-[160px]">Bank</VoucherTh>
                  <VoucherTh class="min-w-[120px]">Check No.</VoucherTh>
                  <VoucherTh align="right" class="min-w-[140px]">
                    Amount
                  </VoucherTh>
                  <VoucherTh class="min-w-[120px]">Status</VoucherTh>
                  <VoucherTh align="right" class="min-w-[120px]">
                    PDF
                  </VoucherTh>
                </THead>
                <tbody>
                  <For each={data.items}>
                    {voucher => (
                      <Tr>
                        <td class="px-6 py-3 text-sm font-semibold text-foreground whitespace-nowrap">
                          {voucher.voucherNo}
                        </td>
                        <td class="px-6 py-3 text-sm text-muted whitespace-nowrap">
                          {formatDatePH(voucher.voucherDate)}
                        </td>
                        <td class="px-6 py-3 text-sm text-foreground">{voucher.payee}</td>
                        <td class="px-6 py-3 text-sm text-foreground">
                          <span class="block max-w-[320px] truncate" title={voucher.particular}>
                            {voucher.particular}
                          </span>
                        </td>
                        <td class="px-6 py-3 text-sm text-muted">{voucher.bankName}</td>
                        <td class="px-6 py-3 text-sm text-muted whitespace-nowrap">
                          {voucher.checkNo || "-"}
                        </td>
                        <td class="px-6 py-3 text-right text-sm font-semibold text-foreground tabular-nums whitespace-nowrap">
                          {formatPeso(voucher.totalAmount)}
                        </td>
                        <td class="px-6 py-3">
                          <StatusBadge status={voucher.status} />
                        </td>
                        <td class="px-6 py-3 text-right">
                          <a
                            href={`${API_URL}/api/finance/check-vouchers/${voucher.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            class="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                          >
                            <Icons.fileText class="h-4 w-4" />
                            Open
                          </a>
                        </td>
                      </Tr>
                    )}
                  </For>
                </tbody>
              </DataTable>

              <div class="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
                <p class="text-xs text-muted">
                  Showing {showingFrom()}-{showingTo()} of {data.total}
                </p>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page() <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    class="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span class="text-xs text-muted">
                    {page()} / {totalPages()}
                  </span>
                  <button
                    type="button"
                    disabled={page() >= totalPages()}
                    onClick={() => setPage(p => Math.min(totalPages(), p + 1))}
                    class="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next 20
                  </button>
                </div>
              </div>
            </Show>
          )}
        </QueryBoundary>
      </section>
    </div>
  )
}
