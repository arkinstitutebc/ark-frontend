// Re-export all types for easy importing

export type { Assessment } from "./assessment"
export type { Attendance } from "./attendance"
export type {
  Batch,
  BatchStatus,
  TrainingCategory,
  TrainingLevel,
} from "./batch"
export type { DashboardStats } from "./dashboard"
export type {
  AccountReceivable,
  ArStatus,
  Bank,
  BankId,
  Transaction,
  Transfer,
  TransferStatus,
  TxnCategory,
  TxnType,
} from "./finance"
export type { StockItem, StockMovement, StockReceipt, StockStatus } from "./inventory"

export type {
  PoStatus,
  PrItem,
  PrStatus,
  PurchaseOrder,
  PurchaseRequest,
} from "./procurement"
export type { Report, ReportType } from "./report"
export type {
  Gender,
  Student,
  StudentStatus,
} from "./student"
