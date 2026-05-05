// Student Status Types
export type StudentStatus = "Enrolled" | "In Training" | "Completed" | "Dropped" | "Certified"

// Gender Types
export type Gender = "Male" | "Female"

// Student Entity
export interface Student {
  id: string
  studentId: string
  firstName: string
  middleName?: string
  lastName: string
  dateOfBirth: string
  gender: Gender
  address: string
  contactNumber: string
  email: string
  educationalAttainment: string
  employmentStatus: string
  batchId: string
  status: StudentStatus
  attendancePercentage: number
  skillsAssessmentScore?: number
  certificationIssued?: string
  certificationDate?: string
  createdAt: string
  updatedAt: string
}
