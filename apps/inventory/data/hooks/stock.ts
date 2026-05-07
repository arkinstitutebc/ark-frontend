import { toast } from "@ark/ui"
import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { StockItem, StockMovement } from "../types"

export function useStock(query?: () => { batchId?: string }) {
  return createQuery(() => {
    const batchId = query?.()?.batchId
    const params = batchId ? `?batchId=${batchId}` : ""
    return {
      queryKey: queryKeys.stock.byBatch(batchId),
      queryFn: () => api<StockItem[]>(`/api/inventory/stock${params}`),
    }
  })
}

export function useStockItem(id: () => string) {
  return createQuery(() => ({
    queryKey: queryKeys.stock.detail(id()),
    queryFn: () => api<StockItem>(`/api/inventory/stock/${id()}`),
    enabled: !!id(),
  }))
}

interface AdjustStockInput {
  id: string
  quantity: number
  reason: string
  notes?: string
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ id, ...data }: AdjustStockInput) =>
      api<{ item: StockItem; movement: StockMovement }>(`/api/inventory/stock/${id}/adjust`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.stock.all })
      qc.invalidateQueries({ queryKey: queryKeys.movements.all })
      toast.success("Stock adjusted")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

interface ReceivePoInput {
  poId: string
  items: Array<{ itemId: string; quantityReceived: number }>
}

export function useReceivePo() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: ReceivePoInput) =>
      api<StockItem[]>("/api/inventory/receive", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.stock.all })
      qc.invalidateQueries({ queryKey: queryKeys.movements.all })
      qc.invalidateQueries({ queryKey: queryKeys.orders.all })
      toast.success("Receipt completed")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
