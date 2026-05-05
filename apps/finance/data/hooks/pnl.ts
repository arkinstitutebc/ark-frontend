import { createQuery } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"

export interface PnlRow {
  label: string
  values: Record<string, number>
  isHeader?: boolean
  isSubtotal?: boolean
  indent?: boolean
  description?: string
}

export interface PnlReport {
  month: string
  batches: Array<{ id: string; batchCode: string }>
  rows: PnlRow[]
}

export function usePnl(month: () => string) {
  return createQuery(() => ({
    queryKey: queryKeys.pnl.byMonth(month()),
    queryFn: () => api<PnlReport>(`/api/finance/pnl?month=${month()}`),
    enabled: !!month(),
  }))
}
