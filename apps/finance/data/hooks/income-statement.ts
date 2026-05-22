import type { IncomeStatement } from "@ark/data-types"
import { createQuery } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"

export interface IncomeStatementRange {
  from?: string
  to?: string
}

export function useIncomeStatement(range: () => IncomeStatementRange) {
  return createQuery(() => {
    const { from, to } = range()
    const params = new URLSearchParams()
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    const qs = params.toString()
    return {
      queryKey: queryKeys.incomeStatement.range({ from, to }),
      queryFn: () => api<IncomeStatement>(`/api/finance/income-statement${qs ? `?${qs}` : ""}`),
      staleTime: 30 * 1000,
    }
  })
}
