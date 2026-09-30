import { toast } from "@ark/ui"
import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { ProcurementExpenseItem } from "../types"

export function useExpenseItems(includeInactive = false) {
  return createQuery(() => ({
    queryKey: queryKeys.expenseItems.filtered(includeInactive),
    queryFn: () =>
      api<ProcurementExpenseItem[]>(
        `/api/procurement/expense-items${includeInactive ? "?includeInactive=true" : ""}`
      ),
  }))
}

export interface ExpenseItemInput {
  code: string
  label: string
  expenseType: "operations" | "assets"
  operationsSubtype?: "training_expense" | "company_overhead" | null
  requiresSpecialRequestNote?: boolean
  active?: boolean
  sortOrder?: number
  schemeIds?: string[]
}

export function useCreateExpenseItem() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: ExpenseItemInput) =>
      api("/api/procurement/expense-items", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenseItems.all })
      toast.success("Expense item created")
    },
    onError: (error: Error) => toast.error(error.message),
  }))
}

export function useUpdateExpenseItem() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ id, ...data }: ExpenseItemInput & { id: string }) =>
      api(`/api/procurement/expense-items/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenseItems.all })
      toast.success("Expense item updated")
    },
    onError: (error: Error) => toast.error(error.message),
  }))
}
