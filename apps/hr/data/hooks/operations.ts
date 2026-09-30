import { toast } from "@ark/ui"
import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type {
  CashAdvanceListItem,
  EmployeeAttendance,
  EmployeeAttendanceStatus,
  EmployeeListItem,
  HrCalendar,
  TrainerAssignment,
} from "../types"

export const useEmployees = () =>
  createQuery(() => ({
    queryKey: queryKeys.employees.all,
    queryFn: () => api<EmployeeListItem[]>("/api/hr/employees"),
  }))
export const useTrainerAssignments = (trainerId?: () => string | undefined) =>
  createQuery(() => {
    const id = trainerId?.()
    return {
      queryKey: id ? queryKeys.trainerAssignments.byTrainer(id) : queryKeys.trainerAssignments.all,
      queryFn: () =>
        api<TrainerAssignment[]>(
          `/api/hr/trainer-assignments${id ? `?trainerId=${encodeURIComponent(id)}` : ""}`
        ),
      enabled: !trainerId || !!id,
    }
  })
export const useCashAdvances = () =>
  createQuery(() => ({
    queryKey: queryKeys.cashAdvances.all,
    queryFn: () => api<CashAdvanceListItem[]>("/api/hr/cash-advances"),
  }))
export const useHrCalendar = (month?: () => string) =>
  createQuery(() => {
    const selected = month?.()
    const start = selected ? `${selected}-01` : undefined
    const end = selected
      ? new Date(Date.UTC(Number(selected.slice(0, 4)), Number(selected.slice(5, 7)), 0))
          .toISOString()
          .slice(0, 10)
      : undefined
    return {
      queryKey: selected ? queryKeys.calendar.month(selected) : queryKeys.calendar.all,
      queryFn: () =>
        api<HrCalendar>(
          `/api/hr/calendar${start && end ? `?startDate=${start}&endDate=${end}` : ""}`
        ),
    }
  })
export const useEmployeeAttendance = (
  filters: () => {
    employeeId?: string
    startDate?: string
    endDate?: string
  }
) =>
  createQuery(() => {
    const values = filters()
    const params = new URLSearchParams()
    if (values.employeeId) params.set("employeeId", values.employeeId)
    if (values.startDate) params.set("startDate", values.startDate)
    if (values.endDate) params.set("endDate", values.endDate)
    const query = params.toString()
    return {
      queryKey: queryKeys.employeeAttendance.filtered(values),
      queryFn: () =>
        api<EmployeeAttendance[]>(`/api/hr/employee-attendance${query ? `?${query}` : ""}`),
    }
  })

function useOperationMutation<T>(
  path: string,
  key: readonly unknown[],
  success: string,
  method = "POST"
) {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: T) => api(path, { method, body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key })
      toast.success(success)
    },
    onError: (error: Error) => toast.error(error.message),
  }))
}

export const useCreateEmployee = () =>
  useOperationMutation<{
    name: string
    email?: string
    jobTitle?: string
    monthlySalary: number
    employeeCode?: string
  }>("/api/hr/employees", queryKeys.employees.all, "Employee created")
export const useUpsertEmployeeAttendance = () =>
  useOperationMutation<{
    employeeId: string
    date: string
    status: EmployeeAttendanceStatus
    timeIn?: string
    timeOut?: string
    notes?: string
  }>("/api/hr/employee-attendance", queryKeys.employeeAttendance.all, "Attendance saved")
export const useAssignTrainer = () =>
  useOperationMutation<{ trainerId: string; batchId: string; fixedFee: number }>(
    "/api/hr/trainer-assignments",
    queryKeys.trainerAssignments.all,
    "Trainer assigned"
  )
export function usePayTrainerFee() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string
      amount: number
      bankId: string
      paymentDate: string
      notes?: string
    }) =>
      api(`/api/hr/trainer-assignments/${id}/payments`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.trainerAssignments.all })
      toast.success("Trainer fee payment posted")
    },
    onError: (error: Error) => toast.error(error.message),
  }))
}
export const useCreateCashAdvance = () =>
  useOperationMutation<{ personId: string; batchId?: string; amount: number; purpose: string }>(
    "/api/hr/cash-advances",
    queryKeys.cashAdvances.all,
    "Cash advance requested"
  )
export function useCashAdvanceAction() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string
      action: "approve" | "reject" | "release"
      bankId?: string
      notes?: string
    }) => api(`/api/hr/cash-advances/${id}/action`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cashAdvances.all })
      toast.success("Cash advance updated")
    },
    onError: (error: Error) => toast.error(error.message),
  }))
}
export function useLiquidateCashAdvance() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string
      amount: number
      receiptUrl: string
      notes?: string
    }) =>
      api(`/api/hr/cash-advances/${id}/liquidate`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cashAdvances.all })
      toast.success("Cash advance liquidated")
    },
    onError: (error: Error) => toast.error(error.message),
  }))
}
export const useCreateHoliday = () =>
  useOperationMutation<{ date: string; name: string; type: string }>(
    "/api/hr/holidays",
    queryKeys.calendar.all,
    "Holiday added"
  )
export const useCreateLeave = () =>
  useOperationMutation<{
    employeeId: string
    startDate: string
    endDate: string
    type: string
    reason?: string
  }>("/api/hr/leaves", queryKeys.calendar.all, "Leave request created")
export function useReviewLeave() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" | "cancel" }) =>
      api(`/api/hr/leaves/${id}/review`, { method: "POST", body: JSON.stringify({ action }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.calendar.all })
      toast.success("Leave updated")
    },
    onError: (error: Error) => toast.error(error.message),
  }))
}
