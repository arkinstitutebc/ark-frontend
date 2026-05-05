import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import toast from "solid-toast"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { PrItem, PurchaseRequest } from "../types"

export function useRequests(query?: () => { status?: string }) {
  return createQuery(() => {
    const status = query?.()?.status
    const params = status ? `?status=${status}` : ""
    return {
      queryKey: queryKeys.requests.byStatus(status),
      queryFn: () => api<PurchaseRequest[]>(`/api/procurement/requests${params}`),
    }
  })
}

export function useRequest(id: () => string) {
  return createQuery(() => ({
    queryKey: queryKeys.requests.detail(id()),
    queryFn: () => api<PurchaseRequest>(`/api/procurement/requests/${id()}`),
    enabled: !!id(),
  }))
}

interface CreatePrInput {
  prCode: string
  batchId: string
  batchName?: string
  batchCode?: string
  category: string
  purpose: string
  items: PrItem[]
  totalAmount: string
  createdBy?: string
}

export function useCreatePr() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: CreatePrInput) =>
      api<PurchaseRequest>("/api/procurement/requests", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.requests.all })
      toast.success("Request submitted")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

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
      toast.success("Request rejected")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
