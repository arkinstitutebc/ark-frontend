import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import toast from "solid-toast"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { Transaction } from "../types"

export function useDisbursements() {
  return createQuery(() => ({
    queryKey: queryKeys.disbursements.all,
    queryFn: () => api<Transaction[]>("/api/finance/disbursements"),
  }))
}

interface CreateDisbursementInput {
  bankId: string
  amount: number
  category: string
  description: string
  batchId?: string
  referenceId?: string
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
