// Batch Status Types
export type BatchStatus = "Not Started" | "In Progress" | "Completed" | "On Hold"

// Training NC Level Types
export type TrainingLevel = "NC I" | "NC II" | "NC III" | "NC IV" | "NC V"

// Training Categories
export type TrainingCategory =
  | "Cookery"
  | "Housekeeping"
  | "Food & Beverage Services"
  | "Bartending"
  | "Bread & Pastry Production"
  | "Front Office Services"
  | "Tour Guiding Services"
  | "Events Management Services"
  | "Local Guiding Services"
  | "Travel Services"

// Batch Entity
export interface Batch {
  id: string
  batchCode: string
  batchNo?: string | null
  rqm?: string | null
  senator: string
  trainingName: string
  trainingOfferingId: string
  trainingOfferingLabel?: string | null
  trainingSchemeId: string
  trainingSchemeLabel?: string | null
  trainingLevel: TrainingLevel
  trainingCategory: TrainingCategory
  startDate: string
  endDate: string
  weeklySchedule?: string | null
  venue: string
  instructor: string
  studentsEnrolled: number
  studentsCapacity: number
  budget: number
  budgetUsed: number
  withholdingRate: number
  grossRevenue: number
  withholdingAmount: number
  netBudget: number
  noticeToProceedUrl?: string | null
  noticeToProceedName?: string | null
  noticeToProceedType?: string | null
  billing?: {
    id: string
    status: "unpaid" | "partially_paid" | "paid" | "overdue" | "cancelled"
    grossRevenue: number
    withholdingAmount: number
    netRevenue: number
    paidAmount: number
    outstandingAmount: number
    dueDate?: string | null
  } | null
  budgetSummary?: {
    grossBudget: number
    withholdingRate: number
    withholdingAmount: number
    spendableBudget: number
    committedAmount: number
    actualAmount: number
    availableAmount: number
    breakdown: {
      procurementCommitted: number
      procurementActual: number
      trainerFeeCommitted: number
      trainerFeePaid: number
      cashAdvanceCommitted: number
      cashAdvanceReleased: number
    }
  }
  status: BatchStatus
  completionPercentage: number
  createdAt: string
  updatedAt: string
}

export interface TrainingSettingOption {
  id: string
  code: string
  label: string
  active: boolean
  sortOrder: number
}
