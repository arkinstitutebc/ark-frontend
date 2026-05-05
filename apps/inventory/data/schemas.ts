import { z } from "zod"

export const adjustStockSchema = z.object({
  quantity: z
    .number()
    .int()
    .refine(n => n !== 0, "Quantity cannot be zero"),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
})
