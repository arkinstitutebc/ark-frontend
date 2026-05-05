export type TrainerStatus = "active" | "inactive" | "on-leave"

export interface Trainer {
  id: string
  name: string
  email?: string
  phone?: string
  specialization?: string
  status: TrainerStatus
  hourlyRate: number | string
  batchAssignments?: string[]
  hireDate?: string
}
