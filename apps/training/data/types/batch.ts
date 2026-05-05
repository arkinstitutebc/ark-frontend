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
  senator: string
  trainingName: string
  trainingLevel: TrainingLevel
  trainingCategory: TrainingCategory
  startDate: string
  endDate: string
  venue: string
  instructor: string
  studentsEnrolled: number
  studentsCapacity: number
  budget: number
  budgetUsed: number
  status: BatchStatus
  completionPercentage: number
  createdAt: string
  updatedAt: string
}
