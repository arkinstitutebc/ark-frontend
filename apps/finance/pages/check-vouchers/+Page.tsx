import {
  Button,
  ConfirmDialog,
  DataTable,
  formatDatePH,
  formatPeso,
  Icons,
  Modal,
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
import { useCheckVouchers, useDeleteCheckVoucher, useVoidCheckVoucher } from "@data/hooks"
import type { CheckVoucher, CheckVoucherLine, CheckVoucherStatus } from "@data/types"
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

function voucherPdfUrl(voucher: CheckVoucher) {
  return `${API_URL}/api/finance/check-vouchers/${voucher.id}/pdf`
}

function IconAction(props: {
  label: string
  icon: typeof Icons.fileText
  tone?: "default" | "danger"
  onClick: (event: MouseEvent) => void
}) {
  const Icon = props.icon
  const toneClass = () =>
    props.tone === "danger"
      ? "text-danger hover:border-danger/30 hover:bg-red-50 hover:text-danger dark:hover:bg-red-950/30"
      : "text-muted hover:border-primary/30 hover:bg-primary/5 hover:text-primary"

  return (
    <button
      type="button"
      title={props.label}
      aria-label={props.label}
      onClick={props.onClick}
      class={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${toneClass()}`}
    >
      <Icon class="h-4 w-4" />
    </button>
  )
}

function DetailItem(props: { label: string; value?: string | number | null; class?: string }) {
  return (
    <div class={`rounded-lg border border-border bg-surface-muted px-4 py-3 ${props.class ?? ""}`}>
      <p class="text-xs font-semibold uppercase tracking-wider text-muted">{props.label}</p>
      <p class="mt-1 break-words text-sm font-medium text-foreground">{props.value || "-"}</p>
    </div>
  )
}

function VoucherLines(props: { title: string; lines: CheckVoucherLine[] }) {
  return (
    <section class="rounded-lg border border-border bg-surface">
      <div class="border-b border-border px-4 py-3">
        <h3 class="text-sm font-semibold text-foreground">{props.title}</h3>
      </div>
      <div class="divide-y divide-border">
        <For each={props.lines}>
          {line => (
            <div class="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_120px] sm:items-center">
              <div>
                <p class="text-sm font-medium text-foreground">{line.account}</p>
              </div>
              <p class="text-sm text-muted">{line.description || "-"}</p>
              <p class="text-left text-sm font-semibold tabular-nums text-foreground sm:text-right">
                {formatPeso(line.amount)}
              </p>
            </div>
          )}
        </For>
      </div>
    </section>
  )
}

function CheckVoucherDetailsModal(props: {
  voucher: CheckVoucher | null
  onClose: () => void
  onVoid: (voucher: CheckVoucher) => void
  onDelete: (voucher: CheckVoucher) => void
}) {
  return (
    <Modal
      open={!!props.voucher}
      onClose={props.onClose}
      title={props.voucher?.voucherNo ?? "Check Voucher"}
      size="xl"
    >
      <Show when={props.voucher}>
        {voucher => (
          <div class="space-y-5">
            <div class="flex flex-col gap-4 rounded-lg border border-border bg-surface-muted p-4 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <StatusBadge status={voucher().status} />
                <h2 class="mt-3 text-xl font-semibold text-foreground">{voucher().payee}</h2>
                <p class="mt-1 text-sm leading-6 text-muted">{voucher().particular}</p>
              </div>
              <div class="shrink-0 text-left sm:text-right">
                <p class="text-xs font-semibold uppercase tracking-wider text-muted">Total</p>
                <p class="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {formatPeso(voucher().totalAmount)}
                </p>
              </div>
            </div>

            <div class="grid gap-3 md:grid-cols-3">
              <DetailItem label="Date" value={formatDatePH(voucher().voucherDate)} />
              <DetailItem label="Bank" value={voucher().bankName} />
              <DetailItem label="Check No." value={voucher().checkNo} />
              <DetailItem label="Address" value={voucher().address} class="md:col-span-2" />
              <DetailItem label="Created By" value={voucher().createdBy} />
            </div>

            <div class="grid gap-4 lg:grid-cols-2">
              <VoucherLines title="Debit Lines" lines={voucher().debitLines} />
              <VoucherLines title="Credit Lines" lines={voucher().creditLines} />
            </div>

            <div class="grid gap-3 md:grid-cols-3">
              <DetailItem label="Prepared By" value={voucher().preparedBy} />
              <DetailItem label="Approved By" value={voucher().approvedBy} />
              <DetailItem label="Received By" value={voucher().receivedBy} />
            </div>

            <div class="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => props.onDelete(voucher())}
                class="inline-flex items-center justify-center gap-2 rounded-lg border border-danger/30 px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Icons.trash class="h-4 w-4" />
                Delete Voucher
              </button>
              <div class="flex flex-col gap-2 sm:flex-row">
                <Show when={voucher().status !== "void"}>
                  <button
                    type="button"
                    onClick={() => props.onVoid(voucher())}
                    class="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
                  >
                    Void
                  </button>
                </Show>
                <a
                  href={voucherPdfUrl(voucher())}
                  target="_blank"
                  rel="noreferrer"
                  class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  <Icons.fileText class="h-4 w-4" />
                  Open PDF
                </a>
              </div>
            </div>
          </div>
        )}
      </Show>
    </Modal>
  )
}

export default function CheckVouchersPage() {
  const [search, setSearch] = createSignal("")
  const [status, setStatus] = createSignal<CheckVoucherStatus | "all">("all")
  const [page, setPage] = createSignal(1)
  const [selectedVoucher, setSelectedVoucher] = createSignal<CheckVoucher | null>(null)
  const [voucherToVoid, setVoucherToVoid] = createSignal<CheckVoucher | null>(null)
  const [voucherToDelete, setVoucherToDelete] = createSignal<CheckVoucher | null>(null)
  const voidVoucher = useVoidCheckVoucher()
  const deleteVoucher = useDeleteCheckVoucher()

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
  const confirmVoid = () => {
    const voucher = voucherToVoid()
    if (!voucher) return
    voidVoucher.mutate(voucher.id, {
      onSuccess: updated => {
        setVoucherToVoid(null)
        setSelectedVoucher(current => (current?.id === updated.id ? updated : current))
      },
    })
  }
  const confirmDelete = () => {
    const voucher = voucherToDelete()
    if (!voucher) return
    deleteVoucher.mutate(voucher.id, {
      onSuccess: () => {
        setVoucherToDelete(null)
        setSelectedVoucher(current => (current?.id === voucher.id ? null : current))
      },
    })
  }
  const openPdf = (voucher: CheckVoucher, event: MouseEvent) => {
    event.stopPropagation()
    window.open(voucherPdfUrl(voucher), "_blank", "noopener,noreferrer")
  }
  const openVoidConfirm = (voucher: CheckVoucher, event?: MouseEvent) => {
    event?.stopPropagation()
    setVoucherToVoid(voucher)
  }
  const openDeleteConfirm = (voucher: CheckVoucher, event?: MouseEvent) => {
    event?.stopPropagation()
    setVoucherToDelete(voucher)
  }

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
        <StatCard label="Pending" numeric value={query.data?.pendingCount ?? "-"} />
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
                  <VoucherTh class="min-w-[320px]">Details</VoucherTh>
                  <VoucherTh class="min-w-[180px]">Payment</VoucherTh>
                  <VoucherTh align="right" class="min-w-[140px]">
                    Amount
                  </VoucherTh>
                  <VoucherTh class="min-w-[120px]">Status</VoucherTh>
                  <VoucherTh align="right" class="min-w-[150px]">
                    Actions
                  </VoucherTh>
                </THead>
                <tbody>
                  <For each={data.items}>
                    {voucher => (
                      <Tr onClick={() => setSelectedVoucher(voucher)}>
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
                          <span class="mt-0.5 block text-xs text-muted">
                            {voucher.createdBy
                              ? `Created by ${voucher.createdBy}`
                              : "Standalone voucher"}
                          </span>
                        </td>
                        <td class="px-6 py-3 text-sm text-muted">
                          <p class="text-sm text-foreground">{voucher.bankName}</p>
                          <p class="text-xs text-muted">{voucher.checkNo || "No check no."}</p>
                        </td>
                        <td class="px-6 py-3 text-right text-sm font-semibold text-foreground tabular-nums whitespace-nowrap">
                          {formatPeso(voucher.totalAmount)}
                        </td>
                        <td class="px-6 py-3">
                          <StatusBadge status={voucher.status} />
                        </td>
                        <td class="px-6 py-3 text-right">
                          <div class="flex items-center justify-end gap-1">
                            <IconAction
                              label="Open PDF"
                              icon={Icons.fileText}
                              onClick={event => openPdf(voucher, event)}
                            />
                            <Show when={voucher.status !== "void"}>
                              <IconAction
                                label="Void voucher"
                                icon={Icons.xCircle}
                                onClick={event => openVoidConfirm(voucher, event)}
                              />
                            </Show>
                            <IconAction
                              label="Delete voucher"
                              icon={Icons.trash}
                              tone="danger"
                              onClick={event => openDeleteConfirm(voucher, event)}
                            />
                          </div>
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

      <ConfirmDialog
        open={!!voucherToVoid()}
        onClose={() => setVoucherToVoid(null)}
        title="Void check voucher?"
        description={`This keeps ${voucherToVoid()?.voucherNo ?? "the voucher"} in the register but marks it as void.`}
        confirmLabel="Void"
        danger
        pending={voidVoucher.isPending}
        onConfirm={confirmVoid}
      />
      <ConfirmDialog
        open={!!voucherToDelete()}
        onClose={() => setVoucherToDelete(null)}
        title="Delete check voucher?"
        description={`This permanently removes ${voucherToDelete()?.voucherNo ?? "the voucher"} from the register.`}
        confirmLabel="Delete Voucher"
        danger
        pending={deleteVoucher.isPending}
        onConfirm={confirmDelete}
      />
      <CheckVoucherDetailsModal
        voucher={selectedVoucher()}
        onClose={() => setSelectedVoucher(null)}
        onVoid={voucher => {
          setSelectedVoucher(null)
          openVoidConfirm(voucher)
        }}
        onDelete={voucher => {
          setSelectedVoucher(null)
          openDeleteConfirm(voucher)
        }}
      />
    </div>
  )
}
