import type { Reimbursement } from "@ark/data-types"
import {
  DataTable,
  formatDatePH,
  formatPeso,
  SortableTh,
  StatusBadge,
  THead,
  Th,
  Tr,
} from "@ark/ui"
import { For, Show } from "solid-js"
import { formatDateTimePH } from "./disbursement-labels"
import type { ReimbursementSortDir, ReimbursementSortKey } from "./reimbursement-list-helpers"

interface ReimbursementTableProps {
  rows: Reimbursement[]
  sortKey: ReimbursementSortKey
  sortDir: ReimbursementSortDir
  onSort: (key: ReimbursementSortKey) => void
  onOpen: (id: string) => void
}

export function ReimbursementTable(props: ReimbursementTableProps) {
  return (
    <DataTable class="max-h-[560px] overflow-auto">
      <THead>
        <SortableTh
          label="Filed"
          active={props.sortKey === "filed"}
          dir={props.sortDir}
          onClick={() => props.onSort("filed")}
          class="min-w-[120px]"
          size="dense"
        />
        <SortableTh
          label="RR Code"
          active={props.sortKey === "code"}
          dir={props.sortDir}
          onClick={() => props.onSort("code")}
          class="min-w-[150px]"
          size="dense"
        />
        <SortableTh
          label="Claimant"
          active={props.sortKey === "claimant"}
          dir={props.sortDir}
          onClick={() => props.onSort("claimant")}
          class="min-w-[220px]"
          size="dense"
        />
        <SortableTh
          label="Activity"
          active={props.sortKey === "activity"}
          dir={props.sortDir}
          onClick={() => props.onSort("activity")}
          class="min-w-[300px]"
          size="dense"
        />
        <StickyTh class="min-w-[120px]">For</StickyTh>
        <SortableTh
          label="Updated"
          active={props.sortKey === "updated"}
          dir={props.sortDir}
          onClick={() => props.onSort("updated")}
          class="min-w-[170px]"
          size="dense"
        />
        <SortableTh
          label="Amount"
          active={props.sortKey === "amount"}
          dir={props.sortDir}
          onClick={() => props.onSort("amount")}
          align="right"
          class="min-w-[140px]"
          size="dense"
        />
        <SortableTh
          label="Status"
          active={props.sortKey === "status"}
          dir={props.sortDir}
          onClick={() => props.onSort("status")}
          class="min-w-[130px]"
          size="dense"
        />
      </THead>
      <tbody>
        <For each={props.rows}>
          {rr => (
            <Tr onClick={() => props.onOpen(rr.id)} class="cursor-pointer">
              <td class="py-3 px-6 text-sm text-muted whitespace-nowrap">
                {formatDatePH(rr.dateFiled ?? rr.createdAt)}
              </td>
              <td class="py-3 px-6 font-mono text-sm font-medium text-foreground whitespace-nowrap">
                {rr.rrCode}
              </td>
              <td class="py-3 px-6 text-sm text-foreground max-w-[220px]">
                <span class="block truncate" title={rr.claimantName ?? rr.createdBy ?? undefined}>
                  {rr.claimantName ?? rr.createdBy ?? "—"}
                </span>
                <Show when={rr.claimantDepartment}>
                  <span class="mt-0.5 block truncate text-xs text-muted">
                    {rr.claimantDepartment}
                  </span>
                </Show>
              </td>
              <td class="py-3 px-6 text-sm text-muted max-w-[300px]">
                <span class="block truncate" title={rr.activity ?? undefined}>
                  {rr.activity ?? "—"}
                </span>
                <Show when={rr.schoolPartner}>
                  <span class="mt-0.5 block truncate text-xs text-muted">{rr.schoolPartner}</span>
                </Show>
              </td>
              <td class="py-3 px-6 text-sm text-foreground whitespace-nowrap">
                {rr.profitCenter ?? "—"}
              </td>
              <td class="py-3 px-6 text-sm text-muted whitespace-nowrap">
                {formatDateTimePH(rr.updatedAt)}
              </td>
              <td class="py-3 px-6 text-right text-sm text-foreground tabular-nums">
                {formatPeso(Number(rr.totalAmount))}
              </td>
              <td class="py-3 px-6">
                <StatusBadge status={rr.status} />
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
