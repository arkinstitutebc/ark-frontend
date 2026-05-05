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

export interface Transaction {
  id: string
  bankId: BankId
  type: TxnType
  category?: TxnCategory
  amount: number
  description: string
  referenceId?: string
  batchId?: string
  createdBy: string
  createdAt: string
  linkedTxnId?: string
}

export type ArStatus = "created" | "billed" | "paid"

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
