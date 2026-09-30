import type { TrainingSettingOption } from "@ark/data-types"
import { toast } from "@ark/ui"
import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"

export function useTrainingOfferings() {
  return createQuery(() => ({
    queryKey: queryKeys.settings.offerings,
    queryFn: () => api<TrainingSettingOption[]>("/api/training/settings/offerings"),
  }))
}

export function useTrainingSchemes(includeInactive = false) {
  return createQuery(() => ({
    queryKey: queryKeys.settings.schemesFiltered(includeInactive),
    queryFn: () =>
      api<TrainingSettingOption[]>(
        `/api/training/settings/schemes${includeInactive ? "?includeInactive=true" : ""}`
      ),
  }))
}

export function useCreateTrainingScheme() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: { code: string; label: string; notes?: string; sortOrder?: number }) =>
      api("/api/training/settings/schemes", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings.schemes })
      toast.success("Training scheme created")
    },
    onError: (error: Error) => toast.error(error.message),
  }))
}

export function useUpdateTrainingScheme() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ id, ...data }: { id: string; label?: string; active?: boolean }) =>
      api(`/api/training/settings/schemes/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings.schemes })
      toast.success("Training scheme updated")
    },
    onError: (error: Error) => toast.error(error.message),
  }))
}
