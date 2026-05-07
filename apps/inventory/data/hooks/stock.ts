import { createCrudHooks, toast } from "@ark/ui"
import { createMutation, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { StockItem, StockMovement } from "../types"

interface StockListQuery {
  batchId?: string
}

const crud = createCrudHooks<
  StockItem,
  StockItem,
  Partial<StockItem>,
  Partial<StockItem>,
  StockListQuery
>({
  basePath: "/api/inventory/stock",
  domain: "stock",
  label: "Stock item",
})

export const useStock = crud.useList
export const useStockItem = crud.useOne

// Bespoke: special adjust endpoint, multi-invalidation
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
      qc.invalidateQueries({ queryKey: ["stock"] })
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
      qc.invalidateQueries({ queryKey: ["stock"] })
      toast.success("Receipt completed")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
