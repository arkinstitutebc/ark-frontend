import { api } from "./api"

export interface PublicTrainingBatch {
  id: string
  batchCode: string
  batchNo?: string | null
  rqm?: string | null
  senator?: string | null
  trainingName: string
  trainingLevel?: string | null
  startDate?: string | null
  endDate?: string | null
  weeklySchedule?: string | null
  venue?: string | null
  studentsEnrolled: number
  studentsCapacity: number
  status: string
}

export interface PublicStudentEnrollmentInput {
  firstName: string
  middleName?: string
  lastName: string
  dateOfBirth: string
  gender: "Male" | "Female"
  address: string
  contactNumber: string
  email?: string
  educationalAttainment: string
  employmentStatus: string
}

export interface PublicStudentEnrollmentResult {
  id: string
  studentId: string | null
  firstName: string
  lastName: string
}

export function getPublicTrainingBatch(batchId: string) {
  return api<PublicTrainingBatch>(`/api/public/training/batches/${batchId}`)
}

export function submitPublicStudentEnrollment(
  batchId: string,
  input: PublicStudentEnrollmentInput
) {
  return api<PublicStudentEnrollmentResult>(`/api/public/training/batches/${batchId}/enrollments`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}
