import { createCrudHooks, toast } from "@ark/ui"
import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { StockItem, StockMovement } from "../types"

interface StockListQuery {
  page?: number
  limit?: number
  search?: string
}

export interface StockListResponse {
  items: StockItem[]
  total: number
  page: number
  limit: number
  summary: {
    byStatus: Partial<Record<StockItem["status"], number>>
  }
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
  queryKeys: {
    all: queryKeys.stock.all,
    list: () => queryKeys.stock.list,
    detail: id => queryKeys.stock.detail(id),
  },
})

export const useStock = crud.useList
export const useStockItem = crud.useOne

export function useCreateTool() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: {
      name: string
      category: string
      unit: string
      unitPrice: number
      trackingMode: "quantity" | "individual"
      quantityOnHand: number
      assetTag?: string
      serialNumber?: string
    }) => api<StockItem>("/api/inventory/stock", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.stock.all })
      toast.success("Tool added")
    },
    onError: (error: Error) => toast.error(error.message),
  }))
}

export function usePaginatedStock(query?: () => StockListQuery | undefined) {
  return createQuery(() => {
    const q = query?.() ?? { page: 1, limit: 20 }
    const params = new URLSearchParams()
    if (q.page) params.set("page", String(q.page))
    if (q.limit) params.set("limit", String(q.limit))
    if (q.search) params.set("search", q.search)
    const qs = params.toString()
    return {
      queryKey: queryKeys.stock.filtered(q),
      queryFn: () => api<StockListResponse>(`/api/inventory/stock${qs ? `?${qs}` : ""}`),
    }
  })
}

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
      toast.success("Stock adjusted")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

interface CycleCountInput {
  note?: string
  items: Array<{ itemId: string; countedQty: number }>
}

interface CycleCountResult {
  itemsAdjusted: number
  itemsUnchanged: number
  movements: Array<{
    itemId: string
    itemName: string
    before: number
    after: number
    delta: number
  }>
}

export function useCycleCount() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: CycleCountInput) =>
      api<CycleCountResult>("/api/inventory/stock/count", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: result => {
      qc.invalidateQueries({ queryKey: queryKeys.stock.all })
      qc.invalidateQueries({ queryKey: queryKeys.movements.all })
      const adjusted = result.itemsAdjusted
      const unchanged = result.itemsUnchanged
      toast.success(
        `Stock take saved — ${adjusted} adjusted${unchanged ? `, ${unchanged} unchanged` : ""}`
      )
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
