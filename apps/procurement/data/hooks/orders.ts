import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import toast from "solid-toast"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { PrItem, PurchaseOrder } from "../types"

export function useOrders(query?: () => { status?: string }) {
  return createQuery(() => {
    const status = query?.()?.status
    const params = status ? `?status=${status}` : ""
    return {
      queryKey: queryKeys.orders.byStatus(status),
      queryFn: () => api<PurchaseOrder[]>(`/api/procurement/orders${params}`),
    }
  })
}

export function useOrder(id: () => string) {
  return createQuery(() => ({
    queryKey: queryKeys.orders.detail(id()),
    queryFn: () => api<PurchaseOrder>(`/api/procurement/orders/${id()}`),
    enabled: !!id(),
  }))
}

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

interface UpdatePoInput {
  id: string
  supplier?: string
  notes?: string
  estimatedDelivery?: string
  status?: string
}

export function useUpdatePo() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ id, ...data }: UpdatePoInput) =>
      api<PurchaseOrder>(`/api/procurement/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all })
      toast.success("Order updated")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
