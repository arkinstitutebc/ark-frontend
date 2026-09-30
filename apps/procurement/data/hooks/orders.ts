import { toast } from "@ark/ui"
import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { PoStatus, PurchaseOrder } from "../types"

export type PurchaseOrderListItem = PurchaseOrder

interface OrdersListQuery {
  status?: string
  page?: number
  limit?: number
  search?: string
}

export interface OrdersListResponse {
  items: PurchaseOrder[]
  total: number
  page: number
  limit: number
  summary: { totalAmount: number; byStatus: Partial<Record<PoStatus, number>> }
}

export function usePaginatedOrders(query?: () => OrdersListQuery | undefined) {
  return createQuery(() => {
    const q = query?.() ?? { page: 1, limit: 20 }
    const params = new URLSearchParams()
    if (q.status) params.set("status", q.status)
    if (q.page) params.set("page", String(q.page))
    if (q.limit) params.set("limit", String(q.limit))
    if (q.search) params.set("search", q.search)
    const qs = params.toString()
    return {
      queryKey: queryKeys.orders.filtered(q),
      queryFn: () =>
        api<OrdersListResponse>(`/api/procurement/purchase-orders${qs ? `?${qs}` : ""}`),
    }
  })
}

export function useOrders(query?: () => OrdersListQuery | undefined) {
  return usePaginatedOrders(query)
}

export function useOrder(id: () => string) {
  return createQuery(() => ({
    queryKey: queryKeys.orders.detail(id()),
    queryFn: () => api<PurchaseOrder>(`/api/procurement/purchase-orders/${id()}`),
    enabled: Boolean(id()),
  }))
}

function usePoAction<T>(action: string, success: string) {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ id, body }: { id: string; body?: T }) =>
      api<PurchaseOrder>(`/api/procurement/purchase-orders/${id}/${action}`, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all })
      qc.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.id) })
      toast.success(success)
    },
    onError: (error: Error) => toast.error(error.message),
  }))
}

export const useConfirmPo = () => usePoAction<never>("confirm", "Purchase order confirmed")
export const useAcknowledgePo = () =>
  usePoAction<{ recipientName: string; recipientSignatureUrl: string; notes?: string }>(
    "acknowledge",
    "Purchase order acknowledged"
  )

export function useUpdatePo() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string
      supplier?: string
      notes?: string
      estimatedDelivery?: string
    }) =>
      api<PurchaseOrder>(`/api/procurement/purchase-orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all })
      qc.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.id) })
      toast.success("Purchase order updated")
    },
    onError: (error: Error) => toast.error(error.message),
  }))
}
