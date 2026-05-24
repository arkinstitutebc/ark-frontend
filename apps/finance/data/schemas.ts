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

export const createTransferSchema = z.object({
  fromBankId: z.string().min(1, "Source bank is required"),
  toBankId: z.string().min(1, "Destination bank is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  description: z.string().trim().min(1, "Description is required").max(500),
  reference: z.string().trim().max(200).optional(),
})

export const createDisbursementSchema = z.object({
  category: z.enum(txnCategoryOptions),
  amount: z.number().positive("Amount must be greater than zero"),
  description: z.string().trim().min(1, "Description is required").max(500),
  referenceId: z.string().trim().max(100).optional(),
  expenseCategory: z.enum(expenseCategoryOptions).optional(),
  profitCenter: z.enum(profitCenterOptions).optional(),
  accountingTreatment: z.enum(accountingTreatmentOptions).optional(),
  costType: z.enum(costTypeOptions).optional(),
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
