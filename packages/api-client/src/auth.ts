import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { API_URL, api } from "./api"

export interface CurrentUser {
  id: string
  email: string
  role: string
  firstName: string
  lastName: string
  mustChangePassword?: boolean
  photoUrl?: string
}

export interface UpdateMeInput {
  firstName?: string
  lastName?: string
}

const MAIN_PORTAL_URL =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_MAIN_PORTAL_URL
    ? import.meta.env.VITE_MAIN_PORTAL_URL
    : "https://portal.arkinstitutebc.com"

export function useCurrentUser() {
  return createQuery(() => ({
    queryKey: ["auth", "me"],
    queryFn: () => api<CurrentUser>("/api/auth/me"),
    staleTime: 5 * 60 * 1000,
    retry: false,
  }))
}

export function useLogin() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: { email: string; password: string }) =>
      api<CurrentUser>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth"] })
    },
  }))
}

/** POSTs /api/auth/logout, then redirects to {mainPortalUrl}/login. */
export async function performLogout(mainPortalUrl?: string) {
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
  } catch {
    // ignore network errors — we redirect regardless
  }
  if (typeof window !== "undefined") {
    window.location.href = `${mainPortalUrl ?? MAIN_PORTAL_URL}/login`
  }
}

export function useChangePassword() {
  return createMutation(() => ({
    mutationFn: (data: { oldPassword: string; newPassword: string }) =>
      api<{ message: string }>("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  }))
}

export function useUpdateMe() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: UpdateMeInput) =>
      api<CurrentUser>("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth", "me"] })
    },
  }))
}

export function useUploadAvatar() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: async (file: File): Promise<CurrentUser> => {
      const form = new FormData()
      form.append("file", file)
      // Direct fetch — DO NOT set Content-Type, the browser must add the
      // multipart boundary itself. The shared api() helper forces JSON.
      const res = await fetch(`${API_URL}/api/auth/me/avatar`, {
        method: "POST",
        credentials: "include",
        body: form,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Upload failed (${res.status})`)
      }
      return res.json() as Promise<CurrentUser>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth", "me"] })
    },
  }))
}
