import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "./api"

export type NotificationType = "user_invited" | "user_deactivated" | "system"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  description: string | null
  link: string | null
  read: boolean
  createdAt: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  unreadCount: number
}

const NOTIFICATIONS_KEY = ["notifications"] as const

/**
 * Polls every 30s. Auto-pauses when the tab is hidden (TanStack Query's
 * default `refetchOnWindowFocus` + `refetchInterval` interaction).
 */
export function useNotifications(opts?: { unreadOnly?: () => boolean; limit?: number }) {
  return createQuery(() => {
    const params = new URLSearchParams()
    if (opts?.unreadOnly?.()) params.set("unread", "true")
    if (opts?.limit) params.set("limit", String(opts.limit))
    const qs = params.toString()
    return {
      queryKey: [
        ...NOTIFICATIONS_KEY,
        { unread: opts?.unreadOnly?.() ?? false, limit: opts?.limit ?? 20 },
      ],
      queryFn: () => api<NotificationListResponse>(`/api/notifications${qs ? `?${qs}` : ""}`),
      refetchInterval: 30_000,
      staleTime: 15_000,
    }
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (id: string) =>
      api<{ ok: true }>(`/api/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  }))
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: () =>
      api<{ markedRead: number }>("/api/notifications/mark-all-read", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  }))
}
