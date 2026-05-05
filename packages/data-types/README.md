# @ark/data-types

Shared TypeScript type definitions used across all 7 portals.

These are the **frontend** representations of the backend's API responses. Source-of-truth schemas live in [`ark-services`](https://github.com/arkinstitutebc/ark-services) (`src/db/schema/`) — these mirror them.

## Domains

| File | Types |
|---|---|
| `batch.ts` | `Batch`, `BatchStatus`, `TrainingCategory`, `TrainingLevel` |
| `student.ts` | `Student`, `StudentStatus`, `Gender` |
| `attendance.ts` | `Attendance` (student) |
| `assessment.ts` | `Assessment` |
| `finance.ts` | `Bank`, `BankId`, `Transaction`, `TxnType`, `TxnCategory`, `Transfer`, `TransferStatus`, `AccountReceivable`, `ArStatus` |
| `procurement.ts` | `PurchaseRequest`, `PrStatus`, `PrItem`, `PurchaseOrder`, `PoStatus` |
| `inventory.ts` | `StockItem`, `StockMovement`, `StockReceipt`, `StockStatus` |
| `hr-attendance.ts` | `HrAttendance`, `AttendanceStatus` (trainer) |
| `payroll.ts` | `PayrollPeriod`, `PayrollEntry`, `PayrollStatus` |
| `trainer.ts` | `Trainer`, `TrainerStatus` |
| `dashboard.ts` | `DashboardStats` |
| `report.ts` | `Report`, `ReportType` |

## Usage

```ts
import type { Batch, Transfer, PurchaseOrder } from "@ark/data-types"
```

Or per-domain (slightly less common):
```ts
import type { Batch } from "@ark/data-types/batch"   // not currently exported, use index
```

## Adding a new type

1. Either add to an existing file (if it fits the domain) or create a new file
2. Re-export from `src/index.ts`

If the type drifts from the backend, fix it here AND update the backend's Drizzle schema. The two are intentionally not auto-generated to keep the API explicit.
