import { toast } from "@ark/ui"
import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { MonthlyToolkeepingLine, MonthlyToolkeepingReport } from "../types"

export const useMonthlyReports = () =>
  createQuery(() => ({
    queryKey: queryKeys.monthly.all,
    queryFn: () => api<MonthlyToolkeepingReport[]>("/api/inventory/monthly"),
  }))
export const useMonthlyReport = (id: () => string) =>
  createQuery(() => ({
    queryKey: queryKeys.monthly.detail(id()),
    queryFn: () =>
      api<{ report: MonthlyToolkeepingReport; lines: MonthlyToolkeepingLine[] }>(
        `/api/inventory/monthly/${id()}`
      ),
    enabled: Boolean(id()),
  }))
export function useGenerateMonthlyReport() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: { month: string; notes?: string }) =>
      api("/api/inventory/monthly", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.monthly.all })
      toast.success("Monthly checklist generated")
    },
    onError: (error: Error) => toast.error(error.message),
  }))
}
export function useUpdateMonthlyReport() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string
      lines: Array<{
        id: string
        countedQuantity: number
        damagedQuantity: number
        condition: "good" | "damaged" | "for-repair" | "lost"
        notes?: string
      }>
      complete?: boolean
    }) => api(`/api/inventory/monthly/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: queryKeys.monthly.all })
      qc.invalidateQueries({ queryKey: queryKeys.monthly.detail(input.id) })
      qc.invalidateQueries({ queryKey: queryKeys.stock.all })
      toast.success(input.complete ? "Monthly checklist completed" : "Checklist saved")
    },
    onError: (error: Error) => toast.error(error.message),
  }))
}
