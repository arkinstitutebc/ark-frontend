import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import toast from "solid-toast"
import { api } from "../api"
import type { Batch, Student } from "../types"

export function useBatches(query?: () => { status?: string }) {
  return createQuery(() => {
    const params = query?.()?.status ? `?status=${query()?.status}` : ""
    return {
      queryKey: ["batches", query?.()?.status],
      queryFn: () => api<Batch[]>(`/api/training/batches${params}`),
    }
  })
}

export function useBatch(id: () => string) {
  return createQuery(() => ({
    queryKey: ["batches", id()],
    queryFn: () => api<Batch>(`/api/training/batches/${id()}`),
    enabled: !!id(),
  }))
}

export function useBatchStudents(batchId: () => string) {
  return createQuery(() => ({
    queryKey: ["batches", batchId(), "students"],
    queryFn: () => api<Student[]>(`/api/training/batches/${batchId()}/students`),
    enabled: !!batchId(),
  }))
}

export function useCreateBatch() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: Partial<Batch>) =>
      api<Batch>("/api/training/batches", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batches"] })
      toast.success("Batch created")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useUpdateBatch() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ id, ...data }: Partial<Batch> & { id: string }) =>
      api<Batch>(`/api/training/batches/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batches"] })
      toast.success("Batch updated")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
