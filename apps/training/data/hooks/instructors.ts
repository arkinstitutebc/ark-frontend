import { createQuery } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { Instructor } from "../types"

export function useInstructors() {
  return createQuery(() => ({
    queryKey: queryKeys.instructors.all,
    queryFn: () => api<Instructor[]>("/api/training/instructors"),
    staleTime: 5 * 60 * 1000,
  }))
}
