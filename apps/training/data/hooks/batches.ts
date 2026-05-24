import { createCrudHooks } from "@ark/ui"
import { createQuery } from "@tanstack/solid-query"
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

// Bespoke: nested students-of-batch endpoint
export function useBatchStudents(batchId: () => string) {
  return createQuery(() => ({
    queryKey: queryKeys.batches.students(batchId()),
    queryFn: () => api<Student[]>(`/api/training/batches/${batchId()}/students`),
    enabled: !!batchId(),
  }))
}
