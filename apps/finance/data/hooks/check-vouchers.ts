import type { CheckVoucher, CheckVoucherLine, CheckVoucherStatus } from "@ark/data-types"
import { toast } from "@ark/ui"
import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"

export interface CreateCheckVoucherInput {
  voucherDate: string
  payee: string
  address?: string
  bankName: string
  checkNo?: string
  particular: string
  debitLines: CheckVoucherLine[]
  creditLines: CheckVoucherLine[]
  preparedBy?: string
  approvedBy?: string
  receivedBy?: string
  status?: CheckVoucherStatus
}

export interface CheckVoucherListFilters {
  page?: number
  limit?: number
  search?: string
  status?: CheckVoucherStatus | "all"
}

export interface CheckVoucherListResponse {
  items: CheckVoucher[]
  total: number
  pendingCount: number
  totalAmount: number
  page: number
  limit: number
}

export function useCheckVouchers(filters?: () => CheckVoucherListFilters) {
  return createQuery(() => {
    const q = filters?.() ?? { page: 1, limit: 20 }
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(q)) {
      if (value !== undefined && value !== "" && value !== "all") params.set(key, String(value))
    }
    const qs = params.toString()
    return {
      queryKey: queryKeys.checkVouchers.filtered(q),
      queryFn: () =>
        api<CheckVoucherListResponse>(`/api/finance/check-vouchers${qs ? `?${qs}` : ""}`),
    }
  })
}

export function useCreateCheckVoucher() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: CreateCheckVoucherInput) =>
      api<CheckVoucher>("/api/finance/check-vouchers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.checkVouchers.all })
      toast.success("Check voucher created")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useVoidCheckVoucher() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (id: string) =>
      api<CheckVoucher>(`/api/finance/check-vouchers/${id}/void`, {
        method: "POST",
      }),
    onSuccess: voucher => {
      qc.invalidateQueries({ queryKey: queryKeys.checkVouchers.all })
      qc.invalidateQueries({ queryKey: queryKeys.checkVouchers.detail(voucher.id) })
      toast.success("Check voucher voided")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useDeleteCheckVoucher() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (id: string) =>
      api<void>(`/api/finance/check-vouchers/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.checkVouchers.all })
      toast.success("Check voucher deleted")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
