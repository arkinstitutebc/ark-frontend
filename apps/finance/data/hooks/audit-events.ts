import { createQuery } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"

export interface AuditEvent {
  id: string
  module: string
  entityType: string
  entityId: string
  action: "create" | "update" | "delete" | "deactivate"
  actor?: string | null
  before?: unknown
  after?: unknown
  note?: string | null
  createdAt: string
}

export interface AuditEventFilters {
  page?: number
  limit?: number
  module?: string
  entityType?: string
  entityId?: string
  action?: AuditEvent["action"]
}

export interface AuditEventListResponse {
  items: AuditEvent[]
  total: number
  page: number
  limit: number
}

export function useAuditEvents(filters?: () => AuditEventFilters) {
  return createQuery(() => {
    const q = filters?.() ?? { page: 1, limit: 20, module: "finance" }
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(q)) {
      if (value !== undefined && value !== "") params.set(key, String(value))
    }
    const qs = params.toString()

    return {
      queryKey: queryKeys.auditEvents.filtered(q),
      queryFn: () => api<AuditEventListResponse>(`/api/finance/audit-events${qs ? `?${qs}` : ""}`),
    }
  })
}
