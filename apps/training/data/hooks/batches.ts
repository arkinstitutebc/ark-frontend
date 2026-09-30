import { createCrudHooks, toast } from "@ark/ui"
import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { Batch, Student } from "../types"

interface BatchListQuery {
  status?: string
}

const crud = createCrudHooks<Batch, Batch, Partial<Batch>, Partial<Batch>, BatchListQuery>({
  basePath: "/api/training/batches",
  domain: "batches",
  label: "Batch",
  queryKeys: {
    all: queryKeys.batches.all,
    list: q => queryKeys.batches.filtered(q),
    detail: id => queryKeys.batches.detail(id),
  },
})

export const useBatches = crud.useList
export const useBatch = crud.useOne
export const useCreateBatch = crud.useCreate
export const useUpdateBatch = crud.useUpdate

export function useRegenerateReceivable() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (batchId: string) =>
      api(`/api/training/batches/${batchId}/receivable`, { method: "POST" }),
    onSuccess: (_data, batchId) => {
      qc.invalidateQueries({ queryKey: queryKeys.batches.all })
      qc.invalidateQueries({ queryKey: queryKeys.batches.detail(batchId) })
      toast.success("Receivable regenerated")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useUpdateNoticeToProceed() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({
      batchId,
      ...data
    }: {
      batchId: string
      url: string
      name: string
      type?: string
    }) =>
      api<Batch>(`/api/training/batches/${batchId}/notice-to-proceed`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.batches.all })
      qc.invalidateQueries({ queryKey: queryKeys.batches.detail(variables.batchId) })
      toast.success("Notice to Proceed updated")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

// Bespoke: nested students-of-batch endpoint
export function useBatchStudents(batchId: () => string) {
  return createQuery(() => ({
    queryKey: queryKeys.batches.students(batchId()),
    queryFn: () => api<Student[]>(`/api/training/batches/${batchId()}/students`),
    enabled: !!batchId(),
  }))
}
