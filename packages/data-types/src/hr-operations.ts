import type { Batch } from "./batch"
import type { Trainer } from "./trainer"

export interface HrPerson {
  id: string
  userId?: string | null
  name: string
  email?: string | null
  phone?: string | null
}

export interface Employee {
  id: string
  personId: string
  employeeCode?: string | null
  jobTitle?: string | null
  monthlySalary: number | string
  status: "active" | "on-leave" | "inactive"
  hireDate?: string | null
}

export interface EmployeeListItem {
  employee: Employee
  person: HrPerson
}

export type EmployeeAttendanceStatus = "present" | "late" | "absent" | "leave" | "holiday"
export interface EmployeeAttendance {
  id: string
  employeeId: string
  date: string
  status: EmployeeAttendanceStatus
  timeIn?: string | null
  timeOut?: string | null
  notes?: string | null
  createdAt: string
}

export interface TrainerAssignment {
  assignment: { id: string; trainerId: string; batchId: string; fixedFee: number | string }
  trainer: Trainer
  batch: Batch
  paidAmount: number
  outstandingAmount: number
}

export type CashAdvanceStatus = "requested" | "approved" | "rejected" | "released" | "liquidated"
export interface CashAdvance {
  id: string
  personId: string
  batchId?: string | null
  amount: number | string
  purpose: string
  status: CashAdvanceStatus
  bankId?: string | null
  liquidatedAmount?: number | string | null
  liquidationReceiptUrl?: string | null
  notes?: string | null
  createdAt: string
}
export interface CashAdvanceListItem {
  cashAdvance: CashAdvance
  person: HrPerson
}

export interface EmployeeLeave {
  id: string
  employeeId: string
  startDate: string
  endDate: string
  type: string
  reason?: string | null
  status: "pending" | "approved" | "rejected" | "cancelled"
}
export interface Holiday {
  id: string
  date: string
  name: string
  type: string
}
export interface HrCalendar {
  leaves: Array<{ leave: EmployeeLeave; employee: Employee; person: HrPerson }>
  holidays: Holiday[]
}
