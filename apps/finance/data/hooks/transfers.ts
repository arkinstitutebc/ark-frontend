import { createCrudHooks, toast } from "@ark/ui"
import { createMutation, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { Transfer } from "../types"

interface CreateTransferInput {
  fromBankId: string
  toBankId: string
  amount: number
  batchId?: string
  reference?: string
  description?: string
}

const crud = createCrudHooks<Transfer, Transfer, CreateTransferInput, Partial<Transfer>, void>({
  basePath: "/api/finance/transfers",
  domain: "transfers",
  label: "Transfer",
  // bespoke create cross-invalidates banks + transactions
  messages: { create: false },
})

export const useTransfers = crud.useList

export function useCreateTransfer() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: CreateTransferInput) =>
      api<Transfer>("/api/finance/transfers", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.transfers.all })
      qc.invalidateQueries({ queryKey: queryKeys.banks.all })
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all })
      qc.invalidateQueries({ queryKey: ["transfers"] })
      toast.success("Transfer created")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
