import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "./api"

export type AdminRole = "admin" | "director" | "trainer"

export interface AdminUser {
  id: string
  email: string
  role: AdminRole
  firstName: string
  lastName: string
  isActive: boolean
  mustChangePassword: boolean
  createdAt: string
  updatedAt: string
}

export interface InviteUserInput {
  email: string
  firstName: string
  lastName: string
  role: AdminRole
}

export interface UpdateUserInput {
  firstName?: string
  lastName?: string
  role?: AdminRole
}

export interface UserWithTempPassword {
  user: AdminUser
  tempPassword: string
}

export function useAdminUsers(includeInactive: () => boolean = () => true) {
  return createQuery(() => ({
    queryKey: ["admin", "users", { includeInactive: includeInactive() }],
    queryFn: () =>
      api<AdminUser[]>(`/api/admin/users${includeInactive() ? "?includeInactive=true" : ""}`),
    staleTime: 30 * 1000,
  }))
}

export function useAdminUser(id: () => string | undefined) {
  return createQuery(() => ({
    queryKey: ["admin", "users", id()],
    queryFn: () => api<AdminUser>(`/api/admin/users/${id()}`),
    enabled: !!id(),
  }))
}

export function useInviteUser() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: InviteUserInput) =>
      api<UserWithTempPassword>("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  }))
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (vars: { id: string; data: UpdateUserInput }) =>
      api<AdminUser>(`/api/admin/users/${vars.id}`, {
        method: "PATCH",
        body: JSON.stringify(vars.data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  }))
}

export function useDeactivateUser() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (id: string) =>
      api<AdminUser>(`/api/admin/users/${id}/deactivate`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  }))
}

export function useActivateUser() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (id: string) =>
      api<AdminUser>(`/api/admin/users/${id}/activate`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  }))
}

export function useResetUserPassword() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (id: string) =>
      api<UserWithTempPassword>(`/api/admin/users/${id}/reset-password`, {
        method: "POST",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  }))
}
