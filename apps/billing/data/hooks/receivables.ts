import { createCrudHooks, toast } from "@ark/ui"
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
  status?: string
  billedAt?: string
  dueDate?: string
  notes?: string
}

interface ReceivablesListQuery {
  status?: string
  page?: number
  limit?: number
  search?: string
}

export interface ReceivablesListResponse {
  items: AccountReceivable[]
  total: number
  page: number
  limit: number
  summary: {
    totalAmount: number
    paidAmount: number
    outstandingAmount: number
    byStatus: Partial<
      Record<
        string,
        {
          count: number
          totalAmount: number
          paidAmount: number
        }
      >
    >
  }
}

interface RecordPaymentResult {
  receivable: AccountReceivable
  transaction: {
    id: string
    amount: string
    referenceId: string | null
    referenceType: string | null
  }
}

const crud = createCrudHooks<
  AccountReceivable,
  AccountReceivable,
  CreateArInput,
  UpdateArInput,
  ReceivablesListQuery
>({
  basePath: "/api/billing/receivables",
  domain: "receivables",
  label: "Receivable",
  messages: { create: "Billing created", update: "Receivable updated" },
  queryKeys: {
    all: queryKeys.receivables.all,
    list: q => queryKeys.receivables.filtered(q),
    detail: id => queryKeys.receivables.detail(id),
  },
})

export function useReceivables(query?: () => ReceivablesListQuery | undefined) {
  return createQuery(() => {
    const q = query?.()
    const params = new URLSearchParams()
    if (q?.status) params.set("status", q.status)
    if (q?.page) params.set("page", String(q.page))
    if (q?.limit) params.set("limit", String(q.limit))
    if (q?.search) params.set("search", q.search)
    const qs = params.toString()
    return {
      queryKey: queryKeys.receivables.filtered(q),
      queryFn: () => api<ReceivablesListResponse>(`/api/billing/receivables${qs ? `?${qs}` : ""}`),
    }
  })
}
export const useReceivable = crud.useOne
export const useCreateAr = crud.useCreate
export const useUpdateAr = crud.useUpdate

// Bespoke: payment endpoint nested under the AR
export function useRecordPayment() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ arId, ...data }: { arId: string; amount: number; notes?: string }) =>
      api<RecordPaymentResult>(`/api/billing/receivables/${arId}/payment`, {
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
