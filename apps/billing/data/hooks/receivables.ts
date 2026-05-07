import { toast } from "@ark/ui"
import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { AccountReceivable } from "../types"

interface CreateArInput {
  batchId: string
  batchCode: string
  amount: string
  notes?: string
}

interface UpdateArInput {
  id: string
  status?: string
  billedAt?: string
  dueDate?: string
  notes?: string
}

export function useReceivables(query?: () => { status?: string }) {
  return createQuery(() => {
    const status = query?.()?.status
    const params = status ? `?status=${status}` : ""
    return {
      queryKey: queryKeys.receivables.byStatus(status),
      queryFn: () => api<AccountReceivable[]>(`/api/billing/receivables${params}`),
    }
  })
}

export function useReceivable(id: () => string) {
  return createQuery(() => ({
    queryKey: queryKeys.receivables.detail(id()),
    queryFn: () => api<AccountReceivable>(`/api/billing/receivables/${id()}`),
    enabled: !!id(),
  }))
}

export function useCreateAr() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: CreateArInput) =>
      api<AccountReceivable>("/api/billing/receivables", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.receivables.all })
      toast.success("Billing created")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useUpdateAr() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ id, ...data }: UpdateArInput) =>
      api<AccountReceivable>(`/api/billing/receivables/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.receivables.all })
      toast.success("Receivable updated")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useRecordPayment() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ arId, ...data }: { arId: string; amount: number; notes?: string }) =>
      api<{ receivable: AccountReceivable }>(`/api/billing/receivables/${arId}/payment`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.receivables.all })
      toast.success("Payment recorded")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
