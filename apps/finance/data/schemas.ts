import { z } from "zod"

export const createTransferSchema = z.object({
  fromBankId: z.string().min(1, "Source bank is required"),
  toBankId: z.string().min(1, "Destination bank is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  description: z.string().min(1, "Description is required"),
  reference: z.string().optional(),
})

export const createDisbursementSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  description: z.string().min(1, "Description is required"),
  referenceId: z.string().optional(),
})
