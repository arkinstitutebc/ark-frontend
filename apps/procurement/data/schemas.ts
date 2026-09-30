import { z } from "zod"

const prItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required"),
  quantity: z.number().int().positive("Quantity must be greater than zero"),
  unit: z.string().trim().min(1, "Unit is required"),
  unitPrice: z.number().finite().positive("Unit price must be greater than zero"),
})

export const createPrSchema = z
  .object({
    expenseType: z.enum(["operations", "assets"]),
    operationsSubtype: z.enum(["training_expense", "company_overhead"]).optional(),
    expenseItemId: z.string().uuid("Select an expense item"),
    batchId: z.string().uuid("Select a batch").optional(),
    specialRequestNote: z.string().trim().max(500, "Keep details under 500 characters").optional(),
    purpose: z
      .string()
      .trim()
      .min(1, "Purpose is required")
      .max(500, "Keep purpose under 500 characters"),
    dateNeeded: z.string().date("Enter a valid date"),
    items: z.array(prItemSchema).min(1, "At least one item is required"),
  })
  .superRefine((data, ctx) => {
    if (data.expenseType === "operations" && !data.operationsSubtype) {
      ctx.addIssue({
        code: "custom",
        path: ["operationsSubtype"],
        message: "Choose an operations type",
      })
    }
    if (
      data.expenseType === "operations" &&
      data.operationsSubtype === "training_expense" &&
      !data.batchId
    ) {
      ctx.addIssue({ code: "custom", path: ["batchId"], message: "Batch is required" })
    }
  })

export const createPoSchema = z.object({
  prId: z.string().min(1, "Purchase request is required"),
  supplier: z.string().min(1, "Supplier is required"),
})

export const createPettyCashRequestSchema = z
  .object({
    purpose: z.string().min(1, "Purpose is required"),
    amountRequested: z.number().positive("Amount must be greater than zero"),
    releaseMethod: z.enum(["digital_transfer", "physical_cash"]),
    releaseContactNumber: z.string().max(40).optional(),
    releaseAccountName: z.string().max(120).optional(),
    attachmentCount: z.number().int().min(0).optional(),
  })
  .refine(
    data =>
      data.releaseMethod !== "digital_transfer" ||
      !!data.releaseContactNumber?.trim() ||
      (data.attachmentCount ?? 0) > 0,
    {
      path: ["releaseContactNumber"],
      message: "Add a mobile number or upload your GCash QR.",
    }
  )

export const pettyCashFundSchema = z.object({
  name: z.string().min(1, "Fund name is required"),
  initialAmount: z.number().min(0, "Initial amount cannot be negative"),
  adjustmentAmount: z.number().min(0, "Adjustment amount cannot be negative"),
})

export const pettyCashLiquidationSchema = z.object({
  actualAmountUsed: z.number().min(0, "Actual amount used cannot be negative"),
})
