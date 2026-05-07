import { toast } from "@ark/ui"
import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import type { Student } from "../types"

export function useStudents(query?: () => { batchId?: string }) {
  return createQuery(() => {
    const params = query?.()?.batchId ? `?batchId=${query()?.batchId}` : ""
    return {
      queryKey: ["students", query?.()?.batchId],
      queryFn: () => api<Student[]>(`/api/training/students${params}`),
    }
  })
}

export function useStudent(id: () => string) {
  return createQuery(() => ({
    queryKey: ["students", id()],
    queryFn: () => api<Student>(`/api/training/students/${id()}`),
    enabled: !!id(),
  }))
}

export function useCreateStudent() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: Partial<Student>) =>
      api<Student>("/api/training/students", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] })
      qc.invalidateQueries({ queryKey: ["batches"] })
      toast.success("Student enrolled")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useUpdateStudent() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ id, ...data }: Partial<Student> & { id: string }) =>
      api<Student>(`/api/training/students/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] })
      qc.invalidateQueries({ queryKey: ["batches"] })
      toast.success("Student updated")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useDeleteStudent() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (id: string) => api<void>(`/api/training/students/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] })
      qc.invalidateQueries({ queryKey: ["batches"] })
      toast.success("Student deleted")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
