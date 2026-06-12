import type {
  AccountingTreatment,
  CostType,
  ExpenseCategory,
  PrAttachment,
  Reimbursement,
  RrItem,
  RrSupportingDocs,
} from "@ark/data-types"
import { createCrudHooks, toast } from "@ark/ui"
import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"

export interface CreateRrInput {
  claimantName?: string
  claimantPosition?: string
  claimantDepartment?: string
  batchId?: string
  batchName?: string
  batchCode?: string
  activity?: string
  schoolPartner?: string
  periodStart?: string
  periodEnd?: string
  dateFiled: string
  expenseCategory: ExpenseCategory
  profitCenter: string
  accountingTreatment: AccountingTreatment
  costType: CostType
  referencedPrCode?: string
  items: RrItem[]
  totalAmount: string
  amountInWords?: string
  supportingDocs?: RrSupportingDocs
  attachments?: PrAttachment[]
}

export type UpdateRrInput = Partial<CreateRrInput>

interface ListQuery {
  status?: string
  page?: number
  limit?: number
  search?: string
  sortKey?: string
  sortDir?: string
}

export interface ReimbursementsListResponse {
  items: Reimbursement[]
  total: number
  page: number
  limit: number
  summary: {
    totalAmount: number
    byStatus: Partial<Record<Reimbursement["status"], number>>
  }
}

const crud = createCrudHooks<Reimbursement, Reimbursement, CreateRrInput, UpdateRrInput, ListQuery>(
  {
    basePath: "/api/reimbursements",
    domain: "reimbursements",
    label: "Reimbursement",
    messages: { create: "Reimbursement submitted", update: "Reimbursement updated" },
    queryKeys: {
      all: queryKeys.reimbursements.all,
      list: q => queryKeys.reimbursements.byStatus(q?.status),
      detail: id => queryKeys.reimbursements.detail(id),
    },
  }
)

export const useReimbursements = crud.useList
export const useReimbursement = crud.useOne
export const useCreateRr = crud.useCreate
export const useUpdateRr = crud.useUpdate

export function usePaginatedReimbursements(query?: () => ListQuery | undefined) {
  return createQuery(() => {
    const q = query?.() ?? { page: 1, limit: 20 }
    const params = new URLSearchParams()
    if (q.status) params.set("status", q.status)
    if (q.page) params.set("page", String(q.page))
    if (q.limit) params.set("limit", String(q.limit))
    if (q.search) params.set("search", q.search)
    if (q.sortKey) params.set("sortKey", q.sortKey)
    if (q.sortDir) params.set("sortDir", q.sortDir)
    const qs = params.toString()
    return {
      queryKey: queryKeys.reimbursements.filtered(q),
      queryFn: () => api<ReimbursementsListResponse>(`/api/reimbursements${qs ? `?${qs}` : ""}`),
    }
  })
}

function bespoke<TBody>(path: (id: string) => string, successMsg: string) {
  return () => {
    const qc = useQueryClient()
    return createMutation(() => ({
      mutationFn: ({ id, ...data }: { id: string } & TBody) =>
        api<Reimbursement>(path(id), { method: "POST", body: JSON.stringify(data) }),
      onSuccess: (_d, variables) => {
        qc.invalidateQueries({ queryKey: queryKeys.reimbursements.all })
        qc.invalidateQueries({ queryKey: queryKeys.reimbursements.detail(variables.id) })
        toast.success(successMsg)
      },
      onError: (err: Error) => toast.error(err.message),
    }))
  }
}

export const useFinanceVerifyRr = bespoke<{ notes?: string }>(
  id => `/api/reimbursements/${id}/finance-verify`,
  "Verified"
)
export const useApproveRr = bespoke<{ approvalNotes?: string }>(
  id => `/api/reimbursements/${id}/approve`,
  "Approved"
)
export const useRejectRr = bespoke<{ approvalNotes: string }>(
  id => `/api/reimbursements/${id}/reject`,
  "Rejected"
)
export const useAccountingNoteRr = bespoke<{ notes?: string }>(
  id => `/api/reimbursements/${id}/accounting-note`,
  "Recorded by accounting"
)
