import { createQuery } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"

export interface TrainingAuditEvent {
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

export interface TrainingAuditResponse {
  items: TrainingAuditEvent[]
  total: number
  page: number
  limit: number
}

export function useBatchAudit(batchId: () => string, limit = 5) {
  return createQuery(() => ({
    queryKey: queryKeys.batches.audit(batchId()),
    queryFn: () =>
      api<TrainingAuditResponse>(`/api/training/batches/${batchId()}/audit?limit=${limit}`),
    enabled: !!batchId(),
  }))
}
