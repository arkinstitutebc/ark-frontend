import { createQuery } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { Transaction } from "../types"

interface TransactionFilters {
  bankId?: string
  batchId?: string
  limit?: number
}

export function useTransactions(filters?: () => TransactionFilters) {
  return createQuery(() => {
    const f = filters?.() || {}
    const params = new URLSearchParams()
    if (f.bankId) params.set("bankId", f.bankId)
    if (f.batchId) params.set("batchId", f.batchId)
    if (f.limit) params.set("limit", String(f.limit))
    const qs = params.toString()
    return {
      queryKey: queryKeys.transactions.filtered(f),
      queryFn: () => api<Transaction[]>(`/api/finance/transactions${qs ? `?${qs}` : ""}`),
    }
  })
}
