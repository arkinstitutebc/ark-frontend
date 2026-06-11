import type { AccountingTreatment, CostType, ExpenseCategory } from "./procurement"

export type BankId = "revenue-vault" | "operational-hub"

export interface Bank {
  id: string
  name: string
  bankName: string
  accountNumber: string
}

export type TxnType = "transfer_in" | "transfer_out" | "income" | "expense"

export type TxnCategory =
  | "payroll"
  | "supplies"
  | "trainer_fees"
  | "utilities"
  | "rent"
  | "transportation"
  | "training_materials"
  | "other"
  // GL line items from the Accounting Treatment matrix.
  | "internet"
  | "meals"
  | "honorarium"
  | "maintenance"
  | "insurance"
  | "legal_fees"
  | "office_equipment"
  | "training_tools"
  | "construction"
  | "ppe"
  | "misc_direct"
  | "misc_indirect"

export interface Transaction {
  id: string
  bankId: BankId
  type: TxnType
  category?: TxnCategory
  amount: number
  transactionDate?: string
  payee?: string
  description: string
  referenceId?: string
  referenceType?: string
  batchId?: string
  expenseCategory?: ExpenseCategory
  profitCenter?: string
  accountingTreatment?: AccountingTreatment
  costType?: CostType
  metadata?: {
    needsReview?: boolean
    updatedAt?: string
    updatedBy?: string
  } | null
  createdBy: string
  createdAt: string
  linkedTxnId?: string
}

export type TransactionAuditAction = "create" | "update" | "delete"

export interface TransactionAuditEvent {
  id: string
  transactionId: string
  action: TransactionAuditAction
  actor?: string | null
  before?: Transaction | null
  after?: Transaction | null
  note?: string | null
  createdAt: string
}

export type CheckVoucherStatus = "draft" | "prepared" | "approved" | "paid" | "void"

export interface CheckVoucherLine {
  account: string
  description?: string
  amount: number
}

export interface CheckVoucher {
  id: string
  voucherNo: string
  voucherDate: string
  payee: string
  address?: string | null
  bankName: string
  checkNo?: string | null
  particular: string
  debitLines: CheckVoucherLine[]
  creditLines: CheckVoucherLine[]
  totalAmount: number
  status: CheckVoucherStatus
  preparedBy?: string | null
  approvedBy?: string | null
  receivedBy?: string | null
  createdBy?: string | null
  createdAt: string
  updatedAt: string
}

export type ArStatus = "created" | "billed" | "paid" | "overdue"

export interface AccountReceivable {
  id: string
  batchId: string
  batchCode: string
  amount: number
  status: ArStatus
  billedAt?: string
  paidAt?: string
  paidAmount?: number
  notes?: string
  createdAt: string
}

export type TransferStatus = "pending" | "completed" | "failed"

export interface Transfer {
  id: string
  fromBankId: string
  toBankId: string
  amount: number
  reference?: string
  status: TransferStatus
  createdBy: string
  createdAt: string
  completedAt?: string
  outTxnId?: string
  inTxnId?: string
}

export type IncomeStatementSegment = "JDVP" | "TWSP-FBS" | "TWSP-HSK"

export type IncomeStatementRowKind = "header" | "detail" | "subtotal" | "computed"

export interface IncomeStatementRow {
  key: string
  label: string
  kind: IncomeStatementRowKind
  bySegment: Record<IncomeStatementSegment, number>
  total: number
  indent?: number
}

export interface IncomeStatement {
  periodFrom: string
  periodTo: string
  segments: IncomeStatementSegment[]
  rows: IncomeStatementRow[]
  netOperatingIncome: number
}
