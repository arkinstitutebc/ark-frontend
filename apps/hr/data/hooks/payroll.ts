import { createCrudHooks, toast } from "@ark/ui"
import { createMutation, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { PayrollEntry, PayrollPeriod } from "../types"

interface PayrollPeriodDetail extends PayrollPeriod {
  entries: Array<PayrollEntry & { employeeName: string; trainerName?: string }>
}

interface ProcessPayrollResult {
  period: PayrollPeriod
  entries: PayrollEntry[]
}

const crud = createCrudHooks<PayrollPeriod, PayrollPeriodDetail, never, never, void>({
  basePath: "/api/hr/payroll",
  domain: "payroll",
  label: "Payroll period",
  queryKeys: {
    all: queryKeys.payroll.all,
    list: () => queryKeys.payroll.all,
    detail: id => queryKeys.payroll.detail(id),
  },
})

export const usePayroll = crud.useList
export const usePayrollPeriod = crud.useOne

// Bespoke: process action endpoint
export function useProcessPayroll() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (periodId: string) =>
      api<ProcessPayrollResult>(`/api/hr/payroll/${periodId}/process`, { method: "POST" }),
    onSuccess: (_data, periodId) => {
      qc.invalidateQueries({ queryKey: queryKeys.payroll.all })
      qc.invalidateQueries({ queryKey: queryKeys.payroll.detail(periodId) })
      toast.success("Payroll processed")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useUpdatePayrollEntry(periodId: () => string) {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({
      id,
      manualAdjustment,
      adjustmentNotes,
    }: {
      id: string
      manualAdjustment: number
      adjustmentNotes: string
    }) =>
      api(`/api/hr/payroll/entries/${id}`, {
        method: "PUT",
        body: JSON.stringify({ manualAdjustment, adjustmentNotes }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payroll.all })
      qc.invalidateQueries({ queryKey: queryKeys.payroll.detail(periodId()) })
      toast.success("Payroll adjustment saved")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export type { PayrollPeriodDetail }
