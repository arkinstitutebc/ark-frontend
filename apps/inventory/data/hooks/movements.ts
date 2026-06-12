import { createQuery } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { StockMovement } from "../types"

interface MovementListQuery {
  itemId?: string
  reference?: string
  type?: "in" | "out" | "adjustment"
  page?: number
  limit?: number
  search?: string
}

export interface MovementListResponse {
  items: StockMovement[]
  total: number
  page: number
  limit: number
  summary: {
    byType: Partial<Record<StockMovement["type"], number>>
  }
}

export function useMovements(query?: () => { itemId?: string }) {
  return createQuery(() => {
    const itemId = query?.()?.itemId
    const params = itemId ? `?itemId=${itemId}` : ""
    return {
      queryKey: queryKeys.movements.byItem(itemId),
      queryFn: () => api<StockMovement[]>(`/api/inventory/movements${params}`),
    }
  })
}

export function usePaginatedMovements(query?: () => MovementListQuery | undefined) {
  return createQuery(() => {
    const q = query?.() ?? { page: 1, limit: 20 }
    const params = new URLSearchParams()
    if (q.itemId) params.set("itemId", q.itemId)
    if (q.reference) params.set("reference", q.reference)
    if (q.type) params.set("type", q.type)
    if (q.page) params.set("page", String(q.page))
    if (q.limit) params.set("limit", String(q.limit))
    if (q.search) params.set("search", q.search)
    const qs = params.toString()
    return {
      queryKey: queryKeys.movements.filtered(q),
      queryFn: () => api<MovementListResponse>(`/api/inventory/movements${qs ? `?${qs}` : ""}`),
    }
  })
}
