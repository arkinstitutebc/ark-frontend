import { createCrudHooks, toast } from "@ark/ui"
import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { PoStatus, PrItem, PurchaseOrder } from "../types"

interface PurchaseOrderListItem {
  id: string
  poCode: string
  prId: string
  prCode?: string | null
  batchId: string
  batchName?: string | null
  supplier?: string | null
  status: PoStatus
  estimatedDelivery?: string | null
}

export type { PurchaseOrderListItem }

interface CreatePoInput {
  poCode: string
  prId: string
  batchId: string
  batchName?: string
  supplier: string
  items: PrItem[]
  totalAmount: string
  estimatedDelivery?: string
  notes?: string
}

interface UpdatePoInput {
  supplier?: string
  notes?: string
  estimatedDelivery?: string
  status?: string
}

interface OrdersListQuery {
  status?: string
  page?: number
  limit?: number
  search?: string
}

export interface OrdersListResponse {
  items: PurchaseOrderListItem[]
  total: number
  page: number
  limit: number
  summary: {
    totalAmount: number
    byStatus: Partial<Record<PoStatus, number>>
  }
}

const crud = createCrudHooks<
  PurchaseOrderListItem,
  PurchaseOrder,
  CreatePoInput,
  UpdatePoInput,
  OrdersListQuery
>({
  basePath: "/api/procurement/orders",
  domain: "orders",
  label: "Order",
  // useCreatePo overrides the default toast + cross-invalidates requests, so silence the factory's
  messages: { create: false },
  queryKeys: {
    all: queryKeys.orders.all,
    list: q => queryKeys.orders.byStatus(q?.status),
    detail: id => queryKeys.orders.detail(id),
  },
})

export const useOrders = crud.useList
export const useOrder = crud.useOne
export const useUpdatePo = crud.useUpdate

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
      queryFn: () => api<OrdersListResponse>(`/api/procurement/orders${qs ? `?${qs}` : ""}`),
    }
  })
}

// Bespoke create — also invalidates requests since creating a PO marks PR as "ordered"
export function useCreatePo() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: CreatePoInput) =>
      api<PurchaseOrder>("/api/procurement/orders", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all })
      qc.invalidateQueries({ queryKey: queryKeys.requests.all })
      toast.success("Order created")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
