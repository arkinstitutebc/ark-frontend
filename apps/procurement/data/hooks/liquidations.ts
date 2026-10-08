import { toast } from "@ark/ui"
import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { PoLiquidation, PoLiquidationListItem, PoLiquidationReceipt } from "../types"

export function useLiquidations() {
  return createQuery(() => ({
    queryKey: queryKeys.liquidations.all,
    queryFn: () => api<PoLiquidationListItem[]>("/api/procurement/liquidations"),
  }))
}

export function useSubmitPoLiquidation() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({
      poId,
      ...data
    }: {
      poId: string
      actualAmount: number
      varianceReason?: string
      receipts: PoLiquidationReceipt[]
    }) =>
      api<PoLiquidation>(`/api/procurement/purchase-orders/${poId}/liquidation`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.liquidations.all })
      qc.invalidateQueries({ queryKey: queryKeys.orders.all })
      toast.success("Liquidation submitted for finance review")
    },
    onError: (error: Error) => toast.error(error.message),
  }))
}

export function useReviewPoLiquidation() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string
      action: "approve" | "reject"
      bankId?: string
      notes?: string
    }) =>
      api<PoLiquidation>(`/api/procurement/liquidations/${id}/review`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.liquidations.all })
      qc.invalidateQueries({ queryKey: queryKeys.orders.all })
      toast.success(
        variables.action === "approve" ? "Liquidation approved" : "Liquidation rejected"
      )
    },
    onError: (error: Error) => toast.error(error.message),
  }))
}
