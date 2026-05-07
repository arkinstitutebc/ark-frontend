import { createQuery } from "@tanstack/solid-query"
import { api } from "../api"
import type { Instructor } from "../types"

export function useInstructors() {
  return createQuery(() => ({
    queryKey: ["training", "instructors"],
    queryFn: () => api<Instructor[]>("/api/training/instructors"),
    staleTime: 5 * 60 * 1000,
  }))
}
