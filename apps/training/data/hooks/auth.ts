import { createQuery } from "@tanstack/solid-query"
import { api } from "../api"

interface CurrentUser {
  id: string
  email: string
  role: string
  firstName: string
  lastName: string
}

export function useCurrentUser() {
  return createQuery(() => ({
    queryKey: ["auth", "me"],
    queryFn: () => api<CurrentUser>("/api/auth/me"),
    staleTime: 5 * 60 * 1000,
    retry: false,
  }))
}
