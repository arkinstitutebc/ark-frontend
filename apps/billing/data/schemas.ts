import { z } from "zod"

export const createArSchema = z.object({
  batchId: z.string().min(1, "Batch is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  notes: z.string().optional(),
})

export const recordPaymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  notes: z.string().optional(),
})
