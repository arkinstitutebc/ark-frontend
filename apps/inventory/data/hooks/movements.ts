import { createQuery } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { StockMovement } from "../types"

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
