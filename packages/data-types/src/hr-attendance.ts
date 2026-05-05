export type AttendanceStatus = "present" | "late" | "absent"

export interface HrAttendance {
  id: string
  trainerId: string
  batchId: string
  date: string
  timeIn: string | null
  timeOut: string | null
  hoursWorked: number
  status: AttendanceStatus
}
