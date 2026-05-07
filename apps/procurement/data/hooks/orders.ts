import { createCrudHooks, toast } from "@ark/ui"
import { createMutation, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { PrItem, PurchaseOrder } from "../types"

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
}

const crud = createCrudHooks<
  PurchaseOrder,
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
})

export const useOrders = crud.useList
export const useOrder = crud.useOne
export const useUpdatePo = crud.useUpdate

// Bespoke create — also invalidates requests since creating a PO marks PR as "ordered"
export function useCreatePo() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: CreatePoInput) =>
      api<PurchaseOrder>("/api/procurement/orders", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all })
      qc.invalidateQueries({ queryKey: queryKeys.requests.all })
      qc.invalidateQueries({ queryKey: ["orders"] })
      toast.success("Order created")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
