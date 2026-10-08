import { createCrudHooks, toast } from "@ark/ui"
import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { PrAttachment, PrItem, PrStatus, PurchaseRequest } from "../types"

// `prCode` no longer accepted from the client — backend generates `PR-YYYY-NNNNN`.
interface CreatePrInput {
  batchId?: string
  batchName?: string
  batchCode?: string
  expenseItemId: string
  expenseType: "operations" | "assets"
  operationsSubtype?: "training_expense" | "company_overhead"
  specialRequestNote?: string
  purpose: string
  dateNeeded: string
  items: PrItem[]
  attachments?: PrAttachment[]
  totalAmount: string
  createdBy?: string
}

interface UpdatePrInput {
  batchId?: string | null
  batchName?: string | null
  batchCode?: string | null
  category?: string
  expenseItemId?: string
  expenseType?: "operations" | "assets"
  operationsSubtype?: "training_expense" | "company_overhead" | null
  specialRequestNote?: string | null
  purpose?: string
  dateNeeded?: string
  items?: PrItem[]
  attachments?: PrAttachment[]
  totalAmount?: string
}

interface RequestsListQuery {
  status?: string
  batchId?: string
  page?: number
  limit?: number
  search?: string
}

export interface RequestsListResponse {
  items: PurchaseRequest[]
  total: number
  page: number
  limit: number
  summary: {
    totalAmount: number
    byStatus: Partial<
      Record<
        PrStatus,
        {
          count: number
          totalAmount: number
        }
      >
    >
  }
}

const crud = createCrudHooks<
  PurchaseRequest,
  PurchaseRequest,
  CreatePrInput,
  UpdatePrInput,
  RequestsListQuery
>({
  basePath: "/api/procurement/requests",
  domain: "requests",
  label: "Request",
  messages: { create: "Request submitted", update: "Request updated" },
  queryKeys: {
    all: queryKeys.requests.all,
    list: q => queryKeys.requests.filtered(q),
    detail: id => queryKeys.requests.detail(id),
  },
})

export function useRequests(query?: () => RequestsListQuery | undefined) {
  return createQuery(() => {
    const q = query?.()
    const params = new URLSearchParams()
    if (q?.status) params.set("status", q.status)
    if (q?.batchId) params.set("batchId", q.batchId)
    if (q?.page) params.set("page", String(q.page))
    if (q?.limit) params.set("limit", String(q.limit))
    if (q?.search) params.set("search", q.search)
    const qs = params.toString()
    return {
      queryKey: queryKeys.requests.filtered(q),
      queryFn: () => api<RequestsListResponse>(`/api/procurement/requests${qs ? `?${qs}` : ""}`),
    }
  })
}
export const useRequest = crud.useOne
export const useCreatePr = crud.useCreate
export const useUpdatePr = crud.useUpdate

// Bespoke: approve / reject action endpoints
export function useApprovePr() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ id, ...data }: { id: string; approvalNotes?: string }) =>
      api<{ request: PurchaseRequest; purchaseOrder: import("../types").PurchaseOrder }>(
        `/api/procurement/requests/${id}/approve`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      ),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.requests.all })
      qc.invalidateQueries({ queryKey: queryKeys.requests.detail(variables.id) })
      qc.invalidateQueries({ queryKey: queryKeys.orders.all })
      toast.success("Request approved and purchase order generated")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useRejectPr() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ id, ...data }: { id: string; approvalNotes: string }) =>
      api<PurchaseRequest>(`/api/procurement/requests/${id}/reject`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.requests.all })
      qc.invalidateQueries({ queryKey: queryKeys.requests.detail(variables.id) })
      toast.success("Request rejected")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
