import { z } from "zod"

const prItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().int().positive("Quantity must be greater than zero"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.number().positive("Unit price must be greater than zero"),
})

export const createPrSchema = z.object({
  batchId: z.string().min(1, "Batch is required"),
  category: z.string().min(1, "Category is required"),
  purpose: z.string().min(1, "Purpose is required"),
  items: z.array(prItemSchema).min(1, "At least one item is required"),
})

export const createPoSchema = z.object({
  prId: z.string().min(1, "Purchase request is required"),
  supplier: z.string().min(1, "Supplier is required"),
})
