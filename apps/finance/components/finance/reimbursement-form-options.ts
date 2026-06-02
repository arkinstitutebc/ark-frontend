import type { AccountingTreatment, CostType, ExpenseCategory } from "@ark/data-types"
import type { SelectOption } from "@ark/ui"
import type { ProfitCenterSetting } from "@data/hooks"
import {
  accountingTreatmentOptions,
  costTypeOptions,
  expenseCategoryOptions,
  profitCenterOptions,
} from "@data/schemas"

const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  "cost-of-services": "Cost of Services",
  "admin-expense": "Admin Expense",
  "fixed-asset": "Fixed Asset",
}

const accountingTreatmentLabels: Record<AccountingTreatment, string> = {
  variable: "Variable",
  "traceable-fixed": "Traceable Fixed",
  "common-overhead": "Common / Overhead",
  capital: "Capital",
}

const costTypeLabels: Record<CostType, string> = {
  "FBS-variable": "FBS Variable",
  "HSK-variable": "HSK Variable",
  common: "Common",
}

export const rrExpenseCategoryOptions: SelectOption<ExpenseCategory>[] = expenseCategoryOptions.map(
  value => ({ label: expenseCategoryLabels[value], value })
)

export const rrAccountingTreatmentOptions: SelectOption<AccountingTreatment>[] =
  accountingTreatmentOptions.map(value => ({ label: accountingTreatmentLabels[value], value }))

export const rrCostTypeOptions: SelectOption<CostType>[] = costTypeOptions.map(value => ({
  label: costTypeLabels[value],
  value,
}))

export function buildReimbursementProfitCenterOptions(
  profitCenters: readonly ProfitCenterSetting[] | undefined
): SelectOption<string>[] {
  const liveCenters = (profitCenters ?? [])
    .filter(center => center.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))

  if (liveCenters.length > 0) {
    return liveCenters.map(center => ({ label: center.label, value: center.code }))
  }

  return profitCenterOptions.map(value => ({
    label: value === "Admin" ? "Admin / Shared" : value,
    value,
  }))
}
