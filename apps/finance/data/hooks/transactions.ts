import { createQuery } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { Transaction } from "../types"

interface TransactionFilters {
  bankId?: string
  batchId?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface TransactionListResponse {
  items: Transaction[]
  total: number
  page: number
  limit: number
}

export function useTransactions(filters?: () => TransactionFilters) {
  return createQuery(() => {
    const f = filters?.() || {}
    const params = new URLSearchParams()
    if (f.bankId) params.set("bankId", f.bankId)
    if (f.batchId) params.set("batchId", f.batchId)
    if (f.startDate) params.set("startDate", f.startDate)
    if (f.endDate) params.set("endDate", f.endDate)
    if (f.page) params.set("page", String(f.page))
    if (f.limit) params.set("limit", String(f.limit))
    const qs = params.toString()
    return {
      queryKey: queryKeys.transactions.filtered(f),
      queryFn: () => api<TransactionListResponse>(`/api/finance/transactions${qs ? `?${qs}` : ""}`),
    }
  })
}
