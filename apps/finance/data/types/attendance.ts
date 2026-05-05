// Attendance Record
export interface Attendance {
  id: string
  studentId: string
  batchId: string
  date: string
  session: "AM" | "PM"
  status: "Present" | "Absent" | "Late" | "Excused"
  notes?: string
}
