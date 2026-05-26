import { DataTable, formatDatePH, formatPeso, StatusBadge, THead, Th, Tr } from "@ark/ui"
import type { Reimbursement } from "@data/types"
import { For } from "solid-js"

interface ReimbursementTableProps {
  rows: Reimbursement[]
  onOpen: (id: string) => void
}

export function ReimbursementTable(props: ReimbursementTableProps) {
  return (
    <DataTable>
      <THead>
        <Th size="dense">RR Code</Th>
        <Th size="dense">Claimant</Th>
        <Th size="dense">Activity</Th>
        <Th size="dense">Filed</Th>
        <Th size="dense" align="right">
          Amount
        </Th>
        <Th size="dense">Status</Th>
      </THead>
      <tbody>
        <For each={props.rows}>
          {rr => (
            <Tr onClick={() => props.onOpen(rr.id)} class="hover:bg-primary/5">
              <td class="py-3 px-6 font-mono text-sm font-medium text-foreground whitespace-nowrap">
                {rr.rrCode}
              </td>
              <td class="py-3 px-6 text-sm text-foreground max-w-[220px]">
                <span class="block truncate" title={rr.claimantName ?? rr.createdBy ?? undefined}>
                  {rr.claimantName ?? rr.createdBy ?? "—"}
                </span>
              </td>
              <td class="py-3 px-6 text-sm text-muted max-w-[300px]">
                <span class="block truncate" title={rr.activity ?? undefined}>
                  {rr.activity ?? "—"}
                </span>
              </td>
              <td class="py-3 px-6 text-sm text-muted whitespace-nowrap">
                {formatDatePH(rr.dateFiled ?? rr.createdAt)}
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
