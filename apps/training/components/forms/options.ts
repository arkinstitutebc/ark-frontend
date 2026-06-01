import { TRAINING_TYPES } from "@data/constants"
import type { Batch, Student } from "@data/types"

export const OTHER_INSTRUCTOR = "__other__"

export const TRAINING_LEVELS = ["NC I", "NC II", "NC III", "NC IV", "NC V"] as const
export const BATCH_STATUSES: Batch["status"][] = [
  "Not Started",
  "In Progress",
  "Completed",
  "On Hold",
]
export const STUDENT_STATUSES: Student["status"][] = [
  "Enrolled",
  "In Training",
  "Completed",
  "Dropped",
  "Certified",
]
export const GENDERS: Student["gender"][] = ["Male", "Female"]
export const EDUCATION_LEVELS = [
  "Elementary Graduate",
  "High School Graduate",
  "College Undergraduate",
  "College Graduate",
  "Vocational Course",
  "Post Graduate",
] as const
export const EMPLOYMENT_STATUSES = [
  "Employed",
  "Unemployed",
  "Underemployed",
  "Self-Employed",
] as const

export const trainingTypeOptions = () => TRAINING_TYPES.map(t => ({ label: t, value: t }))
export const trainingLevelOptions = () => TRAINING_LEVELS.map(l => ({ label: l, value: l }))
export const batchStatusOptions = () => BATCH_STATUSES.map(s => ({ label: s, value: s }))
export const studentStatusOptions = () => STUDENT_STATUSES.map(s => ({ label: s, value: s }))
export const genderOptions = () => GENDERS.map(g => ({ label: g ?? "", value: g ?? "" }))
export const educationOptions = () => EDUCATION_LEVELS.map(l => ({ label: l, value: l }))
export const employmentOptions = () => EMPLOYMENT_STATUSES.map(s => ({ label: s, value: s }))

export function batchSelectLabel(batch: Batch): string {
  return `${batch.batchCode} - ${batch.trainingName} - ${batch.studentsEnrolled}/${batch.studentsCapacity}`
}
