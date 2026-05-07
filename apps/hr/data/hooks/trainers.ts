import { createCrudHooks } from "@ark/ui"
import type { Trainer } from "../types"

interface TrainerListQuery {
  status?: string
}

interface CreateTrainerInput {
  name: string
  email?: string
  phone?: string
  specialization?: string
  hourlyRate?: string
  hireDate?: string
}

interface UpdateTrainerInput {
  name?: string
  email?: string
  phone?: string
  specialization?: string
  hourlyRate?: string
  status?: string
}

const crud = createCrudHooks<
  Trainer,
  Trainer,
  CreateTrainerInput,
  UpdateTrainerInput,
  TrainerListQuery
>({
  basePath: "/api/hr/trainers",
  domain: "trainers",
  label: "Trainer",
  messages: { create: "Trainer added" },
})

export const useTrainers = crud.useList
export const useTrainer = crud.useOne
export const useCreateTrainer = crud.useCreate
export const useUpdateTrainer = crud.useUpdate
