import { DataTable, formatDatePH, formatPeso, THead, Th, Tr } from "@ark/ui"
import type { Transfer } from "@data/types"
import { For } from "solid-js"
import { Icons } from "@/components/ui"

interface TransferHistoryTableProps {
  transfers: Transfer[]
  getBankName: (id: string) => string
}

export function TransferHistoryTable(props: TransferHistoryTableProps) {
  return (
    <DataTable>
      <THead>
        <Th size="dense">Date</Th>
        <Th size="dense">Flow</Th>
        <Th size="dense" align="right">
          Amount
        </Th>
        <Th size="dense">Reference</Th>
      </THead>
      <tbody>
        <For each={props.transfers}>
          {transfer => (
            <Tr>
              <td class="py-3 px-6 text-sm text-muted whitespace-nowrap">
                {formatDatePH(transfer.createdAt)}
              </td>
              <td class="py-3 px-6">
                <div class="flex items-center gap-2 text-sm min-w-[240px]">
                  <span class="text-foreground truncate">
                    {props.getBankName(transfer.fromBankId)}
                  </span>
                  <Icons.arrowRight class="w-4 h-4 text-muted shrink-0" />
                  <span class="text-foreground truncate">
                    {props.getBankName(transfer.toBankId)}
                  </span>
                </div>
              </td>
              <td class="py-3 px-6 text-right text-sm font-semibold text-foreground tabular-nums">
                {formatPeso(Number(transfer.amount))}
              </td>
              <td class="py-3 px-6 text-sm text-muted max-w-[220px]">
                <span class="block truncate" title={transfer.reference || undefined}>
                  {transfer.reference || "-"}
                </span>
              </td>
            </Tr>
          )}
        </For>
      </tbody>
    </DataTable>
  )
}
