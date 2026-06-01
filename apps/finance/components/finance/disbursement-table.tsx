import { DataTable, formatDatePH, formatPeso, SortableTh, THead, Th, Tr } from "@ark/ui"
import type { Transaction } from "@data/types"
import { For, Show } from "solid-js"
import { StatusBadge } from "@/components/ui"
import {
  accountingTreatmentLabel,
  categoryLabel,
  costTypeLabel,
  formatDateTimePH,
} from "./disbursement-labels"

export type DisbursementSortKey = "date" | "payee" | "description" | "category" | "amount"
export type DisbursementSortDir = "asc" | "desc"

interface DisbursementTableProps {
  rows: Transaction[]
  sortKey: DisbursementSortKey
  sortDir: DisbursementSortDir
  onSort: (key: DisbursementSortKey) => void
  onSelect: (txn: Transaction) => void
}

export function DisbursementTable(props: DisbursementTableProps) {
  return (
    <DataTable class="max-h-[560px] overflow-auto">
      <THead>
        <SortableTh
          label="Date"
          active={props.sortKey === "date"}
          dir={props.sortDir}
          onClick={() => props.onSort("date")}
          class="min-w-[110px]"
        />
        <SortableTh
          label="Store / Company"
          active={props.sortKey === "payee"}
          dir={props.sortDir}
          onClick={() => props.onSort("payee")}
          class="min-w-[180px]"
        />
        <SortableTh
          label="Description"
          active={props.sortKey === "description"}
          dir={props.sortDir}
          onClick={() => props.onSort("description")}
          class="min-w-[300px]"
        />
        <SortableTh
          label="Category"
          active={props.sortKey === "category"}
          dir={props.sortDir}
          onClick={() => props.onSort("category")}
          class="min-w-[220px]"
        />
        <StickyTh class="min-w-[130px]">For</StickyTh>
        <StickyTh class="min-w-[180px]">Treatment</StickyTh>
        <StickyTh class="min-w-[190px]">Created By</StickyTh>
        <StickyTh class="min-w-[160px]">Created At</StickyTh>
        <StickyTh class="min-w-[180px]">Updated At</StickyTh>
        <SortableTh
          label="Amount"
          active={props.sortKey === "amount"}
          dir={props.sortDir}
          onClick={() => props.onSort("amount")}
          align="right"
          class="min-w-[140px]"
        />
      </THead>
      <tbody>
        <For each={props.rows}>
          {(txn: Transaction) => (
            <Tr onClick={() => props.onSelect(txn)} class="cursor-pointer">
              <td class="py-3 px-6 text-sm text-muted whitespace-nowrap">
                {formatDatePH(txn.transactionDate ?? txn.createdAt)}
              </td>
              <td class="py-3 px-6 text-sm text-foreground">{txn.payee ?? "-"}</td>
              <td class="py-3 px-6 text-sm text-foreground max-w-[340px]">
                <span class="block truncate" title={txn.description}>
                  {txn.description}
                </span>
              </td>
              <td class="py-3 px-6">
                <div class="flex flex-wrap gap-2">
                  <StatusBadge status={categoryLabel(txn.category)} />
                  <Show when={txn.metadata?.needsReview}>
                    <StatusBadge status="Needs review" />
                  </Show>
                </div>
              </td>
              <td class="py-3 px-6 text-sm text-foreground whitespace-nowrap">
                {txn.profitCenter ?? "-"}
              </td>
              <td class="py-3 px-6 text-sm text-foreground">
                <div class="flex flex-wrap gap-2">
                  <Show when={txn.accountingTreatment} fallback={<span class="text-muted">-</span>}>
                    {treatment => <StatusBadge status={accountingTreatmentLabel(treatment())} />}
                  </Show>
                  <Show when={txn.costType}>
                    {costType => <StatusBadge status={costTypeLabel(costType())} />}
                  </Show>
                </div>
              </td>
              <td class="py-3 px-6 text-sm text-muted whitespace-nowrap">{txn.createdBy ?? "-"}</td>
              <td class="py-3 px-6 text-sm text-muted whitespace-nowrap">
                {formatDatePH(txn.createdAt)}
              </td>
              <td class="py-3 px-6 text-sm text-muted whitespace-nowrap">
                {txn.metadata?.updatedAt ? formatDateTimePH(txn.metadata.updatedAt) : "-"}
              </td>
              <td class="py-3 px-6 text-right text-sm font-semibold text-red-700 tabular-nums whitespace-nowrap">
                {formatPeso(Math.abs(Number(txn.amount)))}
              </td>
            </Tr>
          )}
        </For>
      </tbody>
    </DataTable>
  )
}

function StickyTh(props: {
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
