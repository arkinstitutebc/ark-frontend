import { toast } from "@ark/ui"
import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type {
  PettyCashAttachmentInput,
  PettyCashFund,
  PettyCashReleaseMethod,
  PettyCashRequest,
  PettyCashStatus,
  PettyCashSummary,
} from "../types"

interface PettyCashListQuery {
  status?: PettyCashStatus | "all"
  page?: number
  limit?: number
  search?: string
}

export interface PettyCashListResponse {
  items: PettyCashRequest[]
  total: number
  page: number
  limit: number
  summary: {
    byStatus: Partial<Record<PettyCashStatus, { count: number; amountRequested: number }>>
  }
}

export interface CreatePettyCashRequestInput {
  requestDate?: string
  purpose: string
  amountRequested: string
  releaseMethod: PettyCashReleaseMethod
  releaseContactNumber?: string
  releaseAccountName?: string
  attachments?: PettyCashAttachmentInput[]
}

export interface UpsertPettyCashFundInput {
  name: string
  initialAmount: string
  adjustmentAmount?: string
  notes?: string
}

function invalidatePettyCash(qc: ReturnType<typeof useQueryClient>, id?: string) {
  qc.invalidateQueries({ queryKey: queryKeys.pettyCash.all })
  qc.invalidateQueries({ queryKey: queryKeys.pettyCash.summary })
  if (id) qc.invalidateQueries({ queryKey: queryKeys.pettyCash.detail(id) })
}

export function usePettyCashRequests(query?: () => PettyCashListQuery | undefined) {
  return createQuery(() => {
    const q = query?.()
    const params = new URLSearchParams()
    if (q?.status && q.status !== "all") params.set("status", q.status)
    if (q?.page) params.set("page", String(q.page))
    if (q?.limit) params.set("limit", String(q.limit))
    if (q?.search) params.set("search", q.search)
    const qs = params.toString()
    return {
      queryKey: queryKeys.pettyCash.filtered(q),
      queryFn: () =>
        api<PettyCashListResponse>(`/api/procurement/cash-voucher${qs ? `?${qs}` : ""}`),
    }
  })
}

export function usePettyCashRequest(id: () => string) {
  return createQuery(() => ({
    queryKey: queryKeys.pettyCash.detail(id()),
    queryFn: () => api<PettyCashRequest>(`/api/procurement/cash-voucher/${id()}`),
    enabled: !!id(),
  }))
}

export function usePettyCashSummary(enabled?: () => boolean) {
  return createQuery(() => ({
    queryKey: queryKeys.pettyCash.summary,
    queryFn: () => api<PettyCashSummary>("/api/procurement/cash-voucher/summary"),
    enabled: enabled?.() ?? true,
    retry: false,
  }))
}

export function useCreatePettyCashRequest() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: CreatePettyCashRequestInput) =>
      api<PettyCashRequest>("/api/procurement/cash-voucher", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      invalidatePettyCash(qc)
      toast.success("Cash voucher request submitted")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useUpsertPettyCashFund() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: UpsertPettyCashFundInput) =>
      api<PettyCashFund>("/api/procurement/cash-voucher/fund", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      invalidatePettyCash(qc)
      toast.success("Cash voucher fund saved")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useApprovePettyCash() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ id, ...data }: { id: string; amountApproved?: string; notes?: string }) =>
      api<PettyCashRequest>(`/api/procurement/cash-voucher/${id}/approve`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      invalidatePettyCash(qc, variables.id)
      toast.success("Cash voucher request approved")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useRejectPettyCash() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ id, ...data }: { id: string; rejectionReason: string }) =>
      api<PettyCashRequest>(`/api/procurement/cash-voucher/${id}/reject`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      invalidatePettyCash(qc, variables.id)
      toast.success("Cash voucher request rejected")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useReleasePettyCash() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string
      releaseMethod: PettyCashReleaseMethod
      releasedAt?: string
      notes?: string
    }) =>
      api<PettyCashRequest>(`/api/procurement/cash-voucher/${id}/release`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      invalidatePettyCash(qc, variables.id)
      toast.success("Cash voucher released")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useSubmitPettyCashLiquidation() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string
      actualAmountUsed: string
      remarks?: string
      receipts?: PettyCashAttachmentInput[]
      liquidationForms?: PettyCashAttachmentInput[]
    }) =>
      api<PettyCashRequest>(`/api/procurement/cash-voucher/${id}/liquidation`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      invalidatePettyCash(qc, variables.id)
      toast.success("Liquidation submitted")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useClosePettyCash() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ id, ...data }: { id: string; notes?: string }) =>
      api<PettyCashRequest>(`/api/procurement/cash-voucher/${id}/close`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      invalidatePettyCash(qc, variables.id)
      toast.success("Cash voucher request closed")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useDeletePettyCash() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (id: string) =>
      api<void>(`/api/procurement/cash-voucher/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (_data, id) => {
      invalidatePettyCash(qc, id)
      toast.success("Cash voucher request deleted")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
