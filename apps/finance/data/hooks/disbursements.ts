import { toast } from "@ark/ui"
import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { Transaction, TransactionAuditEvent, TxnCategory } from "../types"

interface CreateDisbursementInput {
  bankId: string
  amount: number
  category: string
  transactionDate?: string
  payee?: string
  description: string
  batchId?: string
  referenceId?: string
  expenseCategory?: string
  profitCenter?: string
  accountingTreatment?: string
  costType?: string
  needsReview?: boolean
}

type UpdateDisbursementInput = Partial<Omit<CreateDisbursementInput, "bankId" | "batchId">> & {
  id: string
}

export interface DisbursementListFilters {
  page?: number
  limit?: number
  search?: string
  category?: TxnCategory
  review?: "needs-review"
  sortKey?: "date" | "payee" | "description" | "category" | "amount"
  sortDir?: "asc" | "desc"
}

export interface DisbursementListResponse {
  items: Transaction[]
  total: number
  totalAmount: number
  page: number
  limit: number
}

export function useDisbursements(filters?: () => DisbursementListFilters) {
  return createQuery(() => {
    const q = filters?.() ?? { page: 1, limit: 20 }
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(q)) {
      if (value !== undefined && value !== "" && value !== "all") params.set(key, String(value))
    }
    const qs = params.toString()
    return {
      queryKey: [...queryKeys.disbursements.all, q] as const,
      queryFn: () =>
        api<DisbursementListResponse>(`/api/finance/disbursements${qs ? `?${qs}` : ""}`),
    }
  })
}

export function useDisbursementAudit(id: () => string | null | undefined) {
  return createQuery(() => ({
    queryKey: queryKeys.disbursements.audit(id() ?? "none"),
    queryFn: () => api<TransactionAuditEvent[]>(`/api/finance/disbursements/${id()}/audit`),
    enabled: !!id(),
  }))
}

export function useCreateDisbursement() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: CreateDisbursementInput) =>
      api<Transaction>("/api/finance/disbursements", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.disbursements.all })
      qc.invalidateQueries({ queryKey: queryKeys.banks.all })
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all })
      toast.success("Disbursement recorded")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useDeleteDisbursement() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (id: string) => api<void>(`/api/finance/disbursements/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.disbursements.all })
      qc.invalidateQueries({ queryKey: queryKeys.banks.all })
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all })
      toast.success("Disbursement deleted")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useUpdateDisbursement() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ id, ...data }: UpdateDisbursementInput) =>
      api<Transaction>(`/api/finance/disbursements/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.disbursements.all })
      qc.invalidateQueries({ queryKey: queryKeys.disbursements.detail(variables.id) })
      qc.invalidateQueries({ queryKey: queryKeys.disbursements.audit(variables.id) })
      qc.invalidateQueries({ queryKey: queryKeys.banks.all })
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all })
      toast.success("Disbursement updated")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
