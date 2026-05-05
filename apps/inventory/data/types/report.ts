// Report Types
export type ReportType =
  | "Batch Completion"
  | "Student Performance"
  | "Attendance Report"
  | "Budget Utilization"
  | "Certification Status"

// Report Entity
export interface Report {
  id: string
  reportType: ReportType
  title: string
  description: string
  period: {
    startDate: string
    endDate: string
  }
  generatedBy: string
  generatedAt: string
  data: Record<string, unknown>
}
