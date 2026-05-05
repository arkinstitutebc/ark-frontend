import { createQuery } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { HrAttendance } from "../types"

export function useAttendance(query?: () => { trainerId?: string; date?: string }) {
  return createQuery(() => {
    const q = query?.() || {}
    const params = new URLSearchParams()
    if (q.trainerId) params.set("trainerId", q.trainerId)
    if (q.date) params.set("date", q.date)
    const qs = params.toString()
    return {
      queryKey: queryKeys.attendance.filtered(q),
      queryFn: () => api<HrAttendance[]>(`/api/hr/attendance${qs ? `?${qs}` : ""}`),
    }
  })
}
