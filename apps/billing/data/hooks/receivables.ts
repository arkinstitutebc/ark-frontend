import { createCrudHooks, toast } from "@ark/ui"
import { createMutation, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { AccountReceivable } from "../types"

interface CreateArInput {
  batchId: string
  batchCode: string
  amount: string
  notes?: string
}

interface UpdateArInput {
  status?: string
  billedAt?: string
  dueDate?: string
  notes?: string
}

interface ReceivablesListQuery {
  status?: string
}

const crud = createCrudHooks<
  AccountReceivable,
  AccountReceivable,
  CreateArInput,
  UpdateArInput,
  ReceivablesListQuery
>({
  basePath: "/api/billing/receivables",
  domain: "receivables",
  label: "Receivable",
  messages: { create: "Billing created", update: "Receivable updated" },
})

export const useReceivables = crud.useList
export const useReceivable = crud.useOne
export const useCreateAr = crud.useCreate
export const useUpdateAr = crud.useUpdate

// Bespoke: payment endpoint nested under the AR
export function useRecordPayment() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ arId, ...data }: { arId: string; amount: number; notes?: string }) =>
      api<{ receivable: AccountReceivable }>(`/api/billing/receivables/${arId}/payment`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.receivables.all })
      qc.invalidateQueries({ queryKey: ["receivables"] })
      toast.success("Payment recorded")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
