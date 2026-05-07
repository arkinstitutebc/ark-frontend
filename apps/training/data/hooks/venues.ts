import { toast } from "@ark/ui"
import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import type { Venue } from "../types"

export function useVenues() {
  return createQuery(() => ({
    queryKey: ["training", "venues"],
    queryFn: () => api<Venue[]>("/api/training/venues"),
    staleTime: 5 * 60 * 1000,
  }))
}

export function useCreateVenue() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: { name: string; notes?: string }) =>
      api<Venue>("/api/training/venues", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training", "venues"] })
      toast.success("Venue added")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useUpdateVenue() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string
      name?: string
      notes?: string
      active?: boolean
    }) =>
      api<Venue>(`/api/training/venues/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training", "venues"] })
      toast.success("Venue updated")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}

export function useDeleteVenue() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (id: string) => api<void>(`/api/training/venues/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training", "venues"] })
      toast.success("Venue removed")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
