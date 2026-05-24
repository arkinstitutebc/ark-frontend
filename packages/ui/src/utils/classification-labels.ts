const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  "cost-of-services": "Cost of Services",
  "admin-expense": "Admin Expense",
  "fixed-asset": "Fixed Asset",
}

const ACCOUNTING_TREATMENT_LABELS: Record<string, string> = {
  variable: "Variable",
  "traceable-fixed": "Traceable Fixed",
  "common-overhead": "Common / Overhead",
  capital: "Capital",
}

const COST_TYPE_LABELS: Record<string, string> = {
  "FBS-variable": "FBS Variable",
  "HSK-variable": "HSK Variable",
  common: "Common",
}

export function formatExpenseCategory(value: string | null | undefined): string {
  if (!value) return "—"
  return EXPENSE_CATEGORY_LABELS[value] ?? value
}

export function formatAccountingTreatment(value: string | null | undefined): string {
  if (!value) return "—"
  return ACCOUNTING_TREATMENT_LABELS[value] ?? value
}

export function formatCostType(value: string | null | undefined): string {
  if (!value) return "—"
  return COST_TYPE_LABELS[value] ?? value
}
