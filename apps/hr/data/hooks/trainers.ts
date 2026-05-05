import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import toast from "solid-toast"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { Trainer } from "../types"

export function useTrainers(query?: () => { status?: string }) {
  return createQuery(() => {
    const status = query?.()?.status
    const params = status ? `?status=${status}` : ""
    return {
      queryKey: queryKeys.trainers.byStatus(status),
      queryFn: () => api<Trainer[]>(`/api/hr/trainers${params}`),
    }
  })
}

export function useTrainer(id: () => string) {
  return createQuery(() => ({
    queryKey: queryKeys.trainers.detail(id()),
    queryFn: () => api<Trainer>(`/api/hr/trainers/${id()}`),
    enabled: !!id(),
  }))
}

interface CreateTrainerInput {
  name: string
  email?: string
  phone?: string
  specialization?: string
  hourlyRate?: string
  hireDate?: string
}

export function useCreateTrainer() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: CreateTrainerInput) =>
      api<Trainer>("/api/hr/trainers", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.trainers.all })
      toast.success("Trainer added")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

interface UpdateTrainerInput {
  id: string
  name?: string
  email?: string
  phone?: string
  specialization?: string
  hourlyRate?: string
  status?: string
}

export function useUpdateTrainer() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ id, ...data }: UpdateTrainerInput) =>
      api<Trainer>(`/api/hr/trainers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.trainers.all })
      toast.success("Trainer updated")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
