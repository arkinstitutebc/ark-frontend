export type PrStatus = "pending" | "under_review" | "approved" | "rejected" | "ordered"

// Accounting classification — kept in sync with the Zod enums in
// ark-services/src/types/procurement.ts.
export type ExpenseCategory = "cost-of-services" | "admin-expense" | "fixed-asset"
export type ProfitCenter = "JDVP" | "TWSP-FBS" | "TWSP-HSK" | "Admin"
export type AccountingTreatment = "variable" | "traceable-fixed" | "common-overhead" | "capital"
export type CostType = "FBS-variable" | "HSK-variable" | "common"

export interface PrItem {
  id: string
  name: string
  specification?: string
  quantity: number
  unit: string
  unitPrice: number
  total: number
  remarks?: string
}

export interface PrAttachment {
  /** Original filename. */
  name: string
  /** Cloudinary `secure_url`. */
  url: string
  /** Cloudinary `resource_type` (image / raw). */
  type?: string
  /** Bytes (informational only). */
  size?: number
  /** ISO timestamp of when the upload completed. */
  uploadedAt?: string
}

export interface PurchaseRequest {
  id: string
  prCode: string
  batchId: string
  batchName: string
  batchCode: string
  category: string
  purpose: string
  /** Date by which the requested items must be on hand (YYYY-MM-DD). */
  dateNeeded?: string
  /** Accounting classification — used by finance for the segmented P&L. */
  expenseCategory?: ExpenseCategory
  profitCenter?: string
  accountingTreatment?: AccountingTreatment
  costType?: CostType
  items: PrItem[]
  attachments?: PrAttachment[] | null
  totalAmount: number
  status: PrStatus
  createdBy: string
  createdAt: string
  /** Intermediate stage in the 3-signature flow (Requestor → Coordinator → Management). */
  coordinatorReviewedAt?: string
  coordinatorReviewedBy?: string
  coordinatorNotes?: string
  approvedAt?: string
  approvedBy?: string
  approvalNotes?: string
}

export type PoStatus = "draft" | "sent" | "partial" | "received" | "cancelled"

export interface PurchaseOrder {
  id: string
  poCode: string
  prId: string
  prCode?: string | null // derived via JOIN on list/get endpoints
  batchId: string
  batchName: string
  supplier: string
  items: PrItem[]
  totalAmount: number
  status: PoStatus
  createdAt: string
  estimatedDelivery?: string
  actualDelivery?: string
  notes?: string
}
