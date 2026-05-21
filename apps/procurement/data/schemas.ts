import { z } from "zod"

const prItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().int().positive("Quantity must be greater than zero"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.number().positive("Unit price must be greater than zero"),
})

// Mirrors the backend enums in ark-services/src/types/procurement.ts.
export const expenseCategoryOptions = ["cost-of-services", "admin-expense", "fixed-asset"] as const
export const profitCenterOptions = ["JDVP", "TWSP-FBS", "TWSP-HSK", "Admin"] as const
export const accountingTreatmentOptions = [
  "variable",
  "traceable-fixed",
  "common-overhead",
  "capital",
] as const
export const costTypeOptions = ["FBS-variable", "HSK-variable", "common"] as const

export const createPrSchema = z.object({
  batchId: z.string().min(1, "Batch is required"),
  category: z.string().min(1, "Category is required"),
  purpose: z.string().min(1, "Purpose is required"),
  dateNeeded: z.string().min(1, "Date needed is required"),
  expenseCategory: z.enum(expenseCategoryOptions, {
    errorMap: () => ({ message: "Expense category is required" }),
  }),
  profitCenter: z.enum(profitCenterOptions, {
    errorMap: () => ({ message: "Profit center is required" }),
  }),
  accountingTreatment: z.enum(accountingTreatmentOptions, {
    errorMap: () => ({ message: "Accounting treatment is required" }),
  }),
  costType: z.enum(costTypeOptions, {
    errorMap: () => ({ message: "Cost type is required" }),
  }),
  items: z.array(prItemSchema).min(1, "At least one item is required"),
})

export const createPoSchema = z.object({
  prId: z.string().min(1, "Purchase request is required"),
  supplier: z.string().min(1, "Supplier is required"),
})
