import type { AccountingTreatment, CostType, ExpenseCategory, PrAttachment } from "./procurement"

export type RrStatus = "pending" | "verified" | "approved" | "rejected"

export interface RrItem {
  id?: string
  date?: string
  description: string
  receiptNo?: string
  category?: string
  amount: number
  hasReceipt?: boolean
}

export interface RrSupportingDocs {
  receipts?: boolean
  deliveryReceipt?: boolean
  quotation?: boolean
  prRef?: boolean
  activity?: boolean
  other?: string
  noReceiptsExplanation?: string
}

export interface Reimbursement {
  id: string
  rrCode: string
  claimantName?: string | null
  claimantPosition?: string | null
  claimantDepartment?: string | null
  batchId?: string | null
  batchName?: string | null
  batchCode?: string | null
  activity?: string | null
  schoolPartner?: string | null
  periodStart?: string | null
  periodEnd?: string | null
  dateFiled?: string | null
  expenseCategory?: ExpenseCategory | null
  profitCenter?: string | null
  accountingTreatment?: AccountingTreatment | null
  costType?: CostType | null
  referencedPrCode?: string | null
  items: RrItem[]
  totalAmount: string | number
  amountInWords?: string | null
  supportingDocs?: RrSupportingDocs | null
  attachments?: PrAttachment[] | null
  status: RrStatus
  createdBy?: string | null
  financeVerifiedBy?: string | null
  financeVerifiedAt?: string | null
  financeVerifyNotes?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
  approvalNotes?: string | null
  accountingNotedBy?: string | null
  accountingNotedAt?: string | null
  accountingNotes?: string | null
  createdAt: string
  updatedAt: string
}
