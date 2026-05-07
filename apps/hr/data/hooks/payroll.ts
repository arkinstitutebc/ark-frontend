import { createCrudHooks, toast } from "@ark/ui"
import { createMutation, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { PayrollEntry, PayrollPeriod } from "../types"

interface PayrollPeriodDetail extends PayrollPeriod {
  entries: Array<PayrollEntry & { trainerName: string }>
}

const crud = createCrudHooks<PayrollPeriod, PayrollPeriodDetail, never, never, void>({
  basePath: "/api/hr/payroll",
  domain: "payroll",
  label: "Payroll period",
})

export const usePayroll = crud.useList
export const usePayrollPeriod = crud.useOne

// Bespoke: process action endpoint
export function useProcessPayroll() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (periodId: string) =>
      api<{ period: PayrollPeriod }>(`/api/hr/payroll/${periodId}/process`, { method: "POST" }),
    onSuccess: (_data, periodId) => {
      qc.invalidateQueries({ queryKey: queryKeys.payroll.all })
      qc.invalidateQueries({ queryKey: queryKeys.payroll.detail(periodId) })
      qc.invalidateQueries({ queryKey: ["payroll"] })
      toast.success("Payroll processed")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export type { PayrollPeriodDetail }
