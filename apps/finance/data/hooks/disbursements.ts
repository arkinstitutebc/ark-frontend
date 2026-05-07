import { createCrudHooks, toast } from "@ark/ui"
import { createMutation, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { Transaction } from "../types"

interface CreateDisbursementInput {
  bankId: string
  amount: number
  category: string
  description: string
  batchId?: string
  referenceId?: string
}

const crud = createCrudHooks<
  Transaction,
  Transaction,
  CreateDisbursementInput,
  Partial<Transaction>,
  void
>({
  basePath: "/api/finance/disbursements",
  domain: "disbursements",
  label: "Disbursement",
  messages: { create: false },
})

export const useDisbursements = crud.useList

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
      qc.invalidateQueries({ queryKey: ["disbursements"] })
      toast.success("Disbursement recorded")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
