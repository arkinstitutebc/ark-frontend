import { createCrudHooks, toast } from "@ark/ui"
import { createMutation, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type {
  AccountingTreatment,
  CostType,
  ExpenseCategory,
  PrAttachment,
  PrItem,
  ProfitCenter,
  PurchaseRequest,
} from "../types"

// `prCode` no longer accepted from the client — backend generates `PR-YYYY-NNNNN`.
interface CreatePrInput {
  batchId: string
  batchName?: string
  batchCode?: string
  category: string
  purpose: string
  dateNeeded: string
  expenseCategory: ExpenseCategory
  profitCenter: ProfitCenter
  accountingTreatment: AccountingTreatment
  costType: CostType
  items: PrItem[]
  attachments?: PrAttachment[]
  totalAmount: string
  createdBy?: string
}

interface UpdatePrInput {
  batchId?: string
  batchName?: string
  batchCode?: string
  category?: string
  purpose?: string
  dateNeeded?: string
  expenseCategory?: ExpenseCategory
  profitCenter?: ProfitCenter
  accountingTreatment?: AccountingTreatment
  costType?: CostType
  items?: PrItem[]
  attachments?: PrAttachment[]
  totalAmount?: string
}

interface RequestsListQuery {
  status?: string
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
})

export const useRequests = crud.useList
export const useRequest = crud.useOne
export const useCreatePr = crud.useCreate
export const useUpdatePr = crud.useUpdate

// Bespoke: coordinator review (intermediate stage before management approval)
export function useCoordinatorReviewPr() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ id, ...data }: { id: string; notes?: string }) =>
      api<PurchaseRequest>(`/api/procurement/requests/${id}/coordinator-review`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.requests.all })
      qc.invalidateQueries({ queryKey: queryKeys.requests.detail(variables.id) })
      qc.invalidateQueries({ queryKey: ["requests"] })
      toast.success("Coordinator review submitted")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

// Bespoke: approve / reject action endpoints
export function useApprovePr() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ id, ...data }: { id: string; approvalNotes?: string }) =>
      api<PurchaseRequest>(`/api/procurement/requests/${id}/approve`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.requests.all })
      qc.invalidateQueries({ queryKey: queryKeys.requests.detail(variables.id) })
      qc.invalidateQueries({ queryKey: ["requests"] })
      toast.success("Request approved")
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
      qc.invalidateQueries({ queryKey: ["requests"] })
      toast.success("Request rejected")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
