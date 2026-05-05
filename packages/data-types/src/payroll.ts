export type PayrollStatus = "draft" | "processed" | "paid"

export interface PayrollEntry {
  id: string
  trainerId: string
  periodId: string
  totalHours: number
  hourlyRate: number
  grossPay: number
  deductions: number
  netPay: number
  status: PayrollStatus
}

export interface PayrollPeriod {
  id: string
  label: string
  periodStart: string
  periodEnd: string
  status: PayrollStatus
  processedAt?: string
  paidAt?: string
  totalGross: number
  totalNet: number
  trainerCount: number
}
