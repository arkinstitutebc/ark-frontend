import { DataTable, formatPeso, Icons, PageHeader, StatCard, THead, Th } from "@ark/ui"

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
  return (
    <div class="mx-auto max-w-[1600px] px-6 py-8 sm:px-8 lg:px-12">
      <PageHeader
        title="Check Vouchers"
        subtitle="Printable payment vouchers with debit and credit lines"
      />

      <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Vouchers" numeric value={0} />
        <StatCard label="Pending" numeric value={0} />
        <StatCard label="Total Amount" numeric value={formatPeso(0)} />
      </div>

      <section class="overflow-hidden rounded-lg border border-border bg-surface">
        <div class="border-b border-border px-5 py-4">
          <h2 class="text-sm font-semibold text-foreground">Voucher Register</h2>
          <p class="mt-1 text-xs text-muted">No check voucher records have been created yet.</p>
        </div>

        <DataTable class="max-h-[600px] overflow-auto">
          <THead>
            <VoucherTh class="min-w-[150px]">Voucher</VoucherTh>
            <VoucherTh class="min-w-[120px]">Date</VoucherTh>
            <VoucherTh class="min-w-[190px]">Payee</VoucherTh>
            <VoucherTh class="min-w-[280px]">Particular</VoucherTh>
            <VoucherTh class="min-w-[220px]">Debit</VoucherTh>
            <VoucherTh class="min-w-[190px]">Credit</VoucherTh>
            <VoucherTh align="right" class="min-w-[140px]">
              Amount
            </VoucherTh>
            <VoucherTh class="min-w-[120px]">Status</VoucherTh>
          </THead>
          <tbody />
        </DataTable>

        <div class="border-t border-border py-12 text-center">
          <Icons.fileText class="mx-auto mb-3 h-12 w-12 text-muted" />
          <p class="text-sm font-medium text-foreground">No check vouchers yet</p>
        </div>
      </section>
    </div>
  )
}
