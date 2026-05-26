import { z } from "zod"

export const expenseCategoryOptions = ["cost-of-services", "admin-expense", "fixed-asset"] as const
export const profitCenterOptions = ["JDVP", "TWSP-FBS", "TWSP-HSK", "Admin"] as const
export const accountingTreatmentOptions = [
  "variable",
  "traceable-fixed",
  "common-overhead",
  "capital",
] as const
export const costTypeOptions = ["FBS-variable", "HSK-variable", "common"] as const
export const txnCategoryOptions = [
  "payroll",
  "supplies",
  "trainer_fees",
  "utilities",
  "rent",
  "transportation",
  "training_materials",
  "other",
  "internet",
  "meals",
  "honorarium",
  "maintenance",
  "insurance",
  "legal_fees",
  "office_equipment",
  "training_tools",
  "construction",
  "ppe",
  "misc_direct",
  "misc_indirect",
] as const

const moneyAmount = z
  .number()
  .positive("Amount must be greater than zero")
  .refine(value => Number.isInteger(Math.round(value * 1000) / 10), {
    message: "Use up to 2 decimal places",
  })

export const createTransferSchema = z.object({
  fromBankId: z.string().min(1, "Source bank is required"),
  toBankId: z.string().min(1, "Destination bank is required"),
  amount: moneyAmount,
  description: z.string().trim().min(1, "Description is required").max(500),
  reference: z.string().trim().max(200).optional(),
})

export const createDisbursementSchema = z.object({
  category: z.enum(txnCategoryOptions),
  transactionDate: z.string().min(1, "Date is required"),
  payee: z.string().trim().max(200).optional(),
  amount: moneyAmount,
  description: z.string().trim().min(1, "Description is required").max(500),
  referenceId: z.string().trim().max(100).optional(),
  expenseCategory: z.enum(expenseCategoryOptions).optional(),
  profitCenter: z.string().trim().min(1).max(30).optional(),
  accountingTreatment: z.enum(accountingTreatmentOptions).optional(),
  costType: z.enum(costTypeOptions).optional(),
  needsReview: z.boolean().optional(),
})

export const updateDisbursementSchema = createDisbursementSchema.extend({
  payee: z.string().trim().max(200).optional(),
  referenceId: z.string().trim().max(100).optional(),
})

const rrItemSchema = z.object({
  date: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  receiptNo: z.string().optional(),
  amount: z.number().nonnegative("Amount cannot be negative"),
  hasReceipt: z.boolean().optional(),
})

export const createRrSchema = z.object({
  claimantName: z.string().min(1, "Claimant name is required"),
  claimantPosition: z.string().optional(),
  claimantDepartment: z.string().optional(),
  activity: z.string().optional(),
  schoolPartner: z.string().optional(),
  dateFiled: z.string().min(1, "Date filed is required"),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  expenseCategory: z.enum(expenseCategoryOptions),
  profitCenter: z.enum(profitCenterOptions),
  accountingTreatment: z.enum(accountingTreatmentOptions),
  costType: z.enum(costTypeOptions),
  referencedPrCode: z.string().optional(),
  items: z.array(rrItemSchema).min(1, "At least one expense item is required"),
  amountInWords: z.string().optional(),
})
