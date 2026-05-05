import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import toast from "solid-toast"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { Transfer } from "../types"

export function useTransfers() {
  return createQuery(() => ({
    queryKey: queryKeys.transfers.all,
    queryFn: () => api<Transfer[]>("/api/finance/transfers"),
  }))
}

interface CreateTransferInput {
  fromBankId: string
  toBankId: string
  amount: number
  batchId?: string
  reference?: string
  description?: string
}

export function useCreateTransfer() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: CreateTransferInput) =>
      api<Transfer>("/api/finance/transfers", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.transfers.all })
      qc.invalidateQueries({ queryKey: queryKeys.banks.all })
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all })
      toast.success("Transfer created")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
