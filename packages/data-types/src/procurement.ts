export type PrStatus = "pending" | "under_review" | "approved" | "rejected" | "ordered"

// Accounting classification — kept in sync with ark-services/src/types/classifications.ts.
export type ExpenseCategory = "cost-of-services" | "admin-expense" | "fixed-asset"
export type ProfitCenter =
  | "JDVP"
  | "JDVP-NIR"
  | "JDVP-HNHS"
  | "JDVP-NOHS"
  | "JDVP-EBMNHS"
  | "JDVP-LCHS"
  | "TWSP"
  | "TWSP-FBS"
  | "TWSP-HSK"
  | "BPP"
  | "Admin"
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

export type PettyCashStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "released"
  | "liquidated"
  | "closed"

export type PettyCashReleaseMethod = "digital_transfer" | "physical_cash"

export type PettyCashAttachmentType = "supporting_document" | "receipt" | "liquidation_form"

export interface PettyCashAttachmentInput {
  name: string
  url: string
  type?: string
  size?: number
}

export interface PettyCashAttachment {
  id: string
  requestId: string
  liquidationId?: string | null
  type: PettyCashAttachmentType
  fileName: string
  fileUrl: string
  fileType?: string | null
  fileSize?: number | null
  uploadedByEmail?: string | null
  createdAt: string
}

export interface PettyCashLiquidation {
  id: string
  requestId: string
  actualAmountUsed: number | string
  returnAmount: number | string
  shortageAmount: number | string
  remarks?: string | null
  liquidatedByEmail?: string | null
  liquidatedAt: string
}

export interface PettyCashRequest {
  id: string
  requestNumber: string
  fundId?: string | null
  requestDate: string
  requestedByUserId?: string | null
  requestedByEmail: string
  requestedByName?: string | null
  department: string
  purpose: string
  amountRequested: number | string
  amountApproved?: number | string | null
  urgency?: string | null
  releaseMethod: PettyCashReleaseMethod
  releaseContactNumber?: string | null
  releaseAccountName?: string | null
  status: PettyCashStatus
  approvedByEmail?: string | null
  approvedAt?: string | null
  rejectedByEmail?: string | null
  rejectedAt?: string | null
  rejectionReason?: string | null
  releasedByEmail?: string | null
  releasedAt?: string | null
  closedByEmail?: string | null
  closedAt?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  liquidation?: PettyCashLiquidation | null
  attachments?: PettyCashAttachment[]
}

export interface PettyCashFund {
  id: string
  name: string
  initialAmount: number | string
  adjustmentAmount: number | string
  notes?: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface PettyCashSummary {
  fund?: PettyCashFund | null
  totalFund: number
  totalReleased: number
  totalLiquidated: number
  totalReturned: number
  remainingBalance: number
  pendingLiquidations: number
  totalRequestsThisMonth: number
  recentTransactions: PettyCashRequest[]
}
