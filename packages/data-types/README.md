# @ark/data-types

Shared TypeScript types: frontend representations of backend API responses.

```ts
import type { Asset, Batch, PurchaseOrder, Reimbursement, Student } from "@ark/data-types"
```

## Files

| File | Types |
|---|---|
| `batch.ts` | `Batch`, `BatchStatus`, `TrainingCategory`, `TrainingLevel` |
| `student.ts` | `Student`, `StudentStatus`, `Gender` |
| `attendance.ts` | `Attendance` |
| `assessment.ts` | `Assessment` |
| `finance.ts` | `Bank`, `BankId`, `Transaction`, `TxnType`, `TxnCategory`, `Transfer`, `TransferStatus`, `AccountReceivable`, `ArStatus`, `IncomeStatement` |
| `gl-account.ts` | `GlAccount`, `GlAccountSection` |
| `asset.ts` | `Asset`, `AssetStatus` |
| `reimbursement.ts` | `Reimbursement`, `RrItem`, `RrStatus`, `RrSupportingDocs` |
| `procurement.ts` | `PurchaseRequest`, `PurchaseOrder`, `PrStatus`, `PoStatus`, `PrItem`, 4-axis classification types |
| `procurement-category.ts` | `ProcurementCategory` |
| `inventory.ts` | `StockItem`, `StockMovement`, `StockReceipt`, `StockStatus` |
| `hr-attendance.ts` | `HrAttendance`, `AttendanceStatus` |
| `payroll.ts` | `PayrollPeriod`, `PayrollEntry`, `PayrollStatus` |
| `trainer.ts` | `Trainer`, `TrainerStatus` |
| `instructor.ts` | `Instructor` |
| `venue.ts` | `Venue` |
| `dashboard.ts` | `DashboardStats` |
| `report.ts` | `Report`, `ReportType` |

## Source of truth

Backend Drizzle schema (`ark-services/src/db/schema/`). When the API shape changes, fix it both places — these aren't auto-generated.
