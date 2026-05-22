import type { AccountingTreatment, ExpenseCategory, TxnCategory } from "@ark/data-types"

// Mirrors the paper Accounting Treatment matrix in
// ark-services/docs/forms/ARK_Income_Statement_Accounting_Treatment_Matt_Copy_1___Accounting_Treatment.csv

export type GlSection = "cost-of-services" | "admin-expense" | "fixed-asset" | "other"

export const GL_SECTIONS: readonly GlSection[] = [
  "cost-of-services",
  "admin-expense",
  "fixed-asset",
  "other",
] as const

export const GL_SECTION_LABELS: Record<GlSection, string> = {
  "cost-of-services": "Cost of Services",
  "admin-expense": "Administrative / Overhead",
  "fixed-asset": "Assets (Capital)",
  other: "Other",
}

interface GlEntry {
  label: string
  section: GlSection
  expenseCategory?: ExpenseCategory
  accountingTreatment?: AccountingTreatment
}

export const GL_CATALOG: Record<TxnCategory, GlEntry> = {
  training_materials: {
    label: "Training Supplies (Consumables)",
    section: "cost-of-services",
    expenseCategory: "cost-of-services",
    accountingTreatment: "variable",
  },
  internet: {
    label: "Internet Allowance",
    section: "cost-of-services",
    expenseCategory: "cost-of-services",
    accountingTreatment: "variable",
  },
  meals: {
    label: "Meal Allowance",
    section: "cost-of-services",
    expenseCategory: "cost-of-services",
    accountingTreatment: "variable",
  },
  transportation: {
    label: "Transportation / Special Arrangements",
    section: "cost-of-services",
    expenseCategory: "cost-of-services",
    accountingTreatment: "variable",
  },
  misc_direct: {
    label: "Miscellaneous (Direct)",
    section: "cost-of-services",
    expenseCategory: "cost-of-services",
    accountingTreatment: "variable",
  },
  trainer_fees: {
    label: "Training / Trainer's Fees",
    section: "cost-of-services",
    expenseCategory: "cost-of-services",
    accountingTreatment: "traceable-fixed",
  },
  honorarium: {
    label: "Honorarium",
    section: "cost-of-services",
    expenseCategory: "cost-of-services",
    accountingTreatment: "variable",
  },

  supplies: {
    label: "Office Supplies",
    section: "admin-expense",
    expenseCategory: "admin-expense",
    accountingTreatment: "common-overhead",
  },
  maintenance: {
    label: "Maintenance",
    section: "admin-expense",
    expenseCategory: "admin-expense",
    accountingTreatment: "common-overhead",
  },
  payroll: {
    label: "Salaries & Wages",
    section: "admin-expense",
    expenseCategory: "admin-expense",
    accountingTreatment: "common-overhead",
  },
  utilities: {
    label: "Utilities",
    section: "admin-expense",
    expenseCategory: "admin-expense",
    accountingTreatment: "common-overhead",
  },
  misc_indirect: {
    label: "Miscellaneous (Indirect)",
    section: "admin-expense",
    expenseCategory: "admin-expense",
    accountingTreatment: "common-overhead",
  },
  insurance: {
    label: "Insurance",
    section: "admin-expense",
    expenseCategory: "admin-expense",
    accountingTreatment: "common-overhead",
  },
  legal_fees: {
    label: "Legal / Registration Fees",
    section: "admin-expense",
    expenseCategory: "admin-expense",
    accountingTreatment: "common-overhead",
  },

  training_tools: {
    label: "Training Tools & Equipment",
    section: "fixed-asset",
    expenseCategory: "fixed-asset",
    accountingTreatment: "capital",
  },
  office_equipment: {
    label: "Office Equipment",
    section: "fixed-asset",
    expenseCategory: "fixed-asset",
    accountingTreatment: "capital",
  },
  construction: {
    label: "Construction of Facilities",
    section: "fixed-asset",
    expenseCategory: "fixed-asset",
    accountingTreatment: "capital",
  },
  ppe: {
    label: "PPE / Facility Improvements",
    section: "fixed-asset",
    expenseCategory: "fixed-asset",
    accountingTreatment: "capital",
  },

  rent: { label: "Rent", section: "other" },
  other: { label: "Other", section: "other" },
}

export const GL_CATEGORY_LABELS: Record<TxnCategory, string> = Object.fromEntries(
  Object.entries(GL_CATALOG).map(([k, v]) => [k, v.label])
) as Record<TxnCategory, string>

export function glDefault(
  category: TxnCategory
): { expenseCategory: ExpenseCategory; accountingTreatment: AccountingTreatment } | null {
  const entry = GL_CATALOG[category]
  if (!entry?.expenseCategory || !entry?.accountingTreatment) return null
  return {
    expenseCategory: entry.expenseCategory,
    accountingTreatment: entry.accountingTreatment,
  }
}

export function categoryOptionsBySection(): Array<{
  section: GlSection
  label: string
  options: Array<{ value: TxnCategory; label: string }>
}> {
  return GL_SECTIONS.map(section => ({
    section,
    label: GL_SECTION_LABELS[section],
    options: (Object.entries(GL_CATALOG) as Array<[TxnCategory, GlEntry]>)
      .filter(([, entry]) => entry.section === section)
      .map(([code, entry]) => ({ value: code, label: entry.label })),
  }))
}
