import type { Reimbursement, RrStatus } from "@ark/data-types"

export type ReimbursementFilter = "all" | RrStatus
export type ReimbursementSortKey =
  | "filed"
  | "code"
  | "claimant"
  | "activity"
  | "amount"
  | "status"
  | "updated"
export type ReimbursementSortDir = "asc" | "desc"

export const reimbursementStatusFilters: Array<{ value: ReimbursementFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
]

export const reimbursementQueueFilters: Array<{
  value: Extract<RrStatus, "pending" | "verified">
  label: string
}> = [
  { value: "pending", label: "Finance queue" },
  { value: "verified", label: "Management queue" },
]

export function reimbursementStats(rows: Reimbursement[]) {
  return {
    total: rows.length,
    pending: rows.filter(rr => rr.status === "pending").length,
    verified: rows.filter(rr => rr.status === "verified").length,
    approved: rows.filter(rr => rr.status === "approved").length,
    rejected: rows.filter(rr => rr.status === "rejected").length,
    totalAmount: rows.reduce((sum, rr) => sum + Number(rr.totalAmount), 0),
  }
}

export function filterReimbursements(
  rows: Reimbursement[],
  filter: ReimbursementFilter,
  search = ""
) {
  const query = search.trim().toLowerCase()
  return rows.filter(rr => {
    const matchStatus = filter === "all" || rr.status === filter
    const matchSearch =
      !query ||
      rr.rrCode.toLowerCase().includes(query) ||
      rr.claimantName?.toLowerCase().includes(query) ||
      rr.createdBy?.toLowerCase().includes(query) ||
      rr.activity?.toLowerCase().includes(query) ||
      rr.schoolPartner?.toLowerCase().includes(query) ||
      rr.profitCenter?.toLowerCase().includes(query)
    return matchStatus && matchSearch
  })
}

export function sortReimbursements(
  rows: Reimbursement[],
  sortKey: ReimbursementSortKey,
  sortDir: ReimbursementSortDir
) {
  const direction = sortDir === "asc" ? 1 : -1
  return [...rows].sort((a, b) => compareReimbursements(a, b, sortKey) * direction)
}

function compareReimbursements(a: Reimbursement, b: Reimbursement, sortKey: ReimbursementSortKey) {
  if (sortKey === "amount") return Number(a.totalAmount) - Number(b.totalAmount)
  if (sortKey === "filed")
    return dateValue(a.dateFiled ?? a.createdAt) - dateValue(b.dateFiled ?? b.createdAt)
  if (sortKey === "updated") return dateValue(a.updatedAt) - dateValue(b.updatedAt)
  if (sortKey === "code") return a.rrCode.localeCompare(b.rrCode)
  if (sortKey === "claimant") {
    return (a.claimantName ?? a.createdBy ?? "").localeCompare(b.claimantName ?? b.createdBy ?? "")
  }
  if (sortKey === "activity") return (a.activity ?? "").localeCompare(b.activity ?? "")
  return a.status.localeCompare(b.status)
}

function dateValue(value: string | null | undefined) {
  if (!value) return 0
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}
