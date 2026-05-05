import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import toast from "solid-toast"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { PayrollEntry, PayrollPeriod } from "../types"

interface PayrollPeriodDetail extends PayrollPeriod {
  entries: Array<PayrollEntry & { trainerName: string }>
}

export function usePayroll() {
  return createQuery(() => ({
    queryKey: queryKeys.payroll.all,
    queryFn: () => api<PayrollPeriod[]>("/api/hr/payroll"),
  }))
}

export function usePayrollPeriod(id: () => string) {
  return createQuery(() => ({
    queryKey: queryKeys.payroll.detail(id()),
    queryFn: () => api<PayrollPeriodDetail>(`/api/hr/payroll/${id()}`),
    enabled: !!id(),
  }))
}

export function useProcessPayroll() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (periodId: string) =>
      api<{ period: PayrollPeriod }>(`/api/hr/payroll/${periodId}/process`, { method: "POST" }),
    onSuccess: (_data, periodId) => {
      qc.invalidateQueries({ queryKey: queryKeys.payroll.all })
      qc.invalidateQueries({ queryKey: queryKeys.payroll.detail(periodId) })
      toast.success("Payroll processed")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export type { PayrollPeriodDetail }
