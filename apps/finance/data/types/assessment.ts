// Assessment/Grading Record
export interface Assessment {
  id: string
  studentId: string
  batchId: string
  assessmentName: string
  assessmentType: "Competency" | "Knowledge" | "Performance"
  score: number
  maxScore: number
  remarks?: string
  date: string
}
