import { GL_CATALOG } from "@data/gl-defaults"
import type { TransactionAuditEvent, TxnCategory } from "@data/types"

const ACCOUNTING_TREATMENT_LABELS: Record<string, string> = {
  variable: "Variable",
  "traceable-fixed": "Traceable fixed",
  "common-overhead": "Common / admin",
  capital: "Capital",
}

const COST_TYPE_LABELS: Record<string, string> = {
  "FBS-variable": "FBS",
  "HSK-variable": "HSK",
  common: "Common",
}

export function categoryLabel(category?: string) {
  if (!category) return "Other"
  return GL_CATALOG[category as TxnCategory]?.label ?? category.replace(/_/g, " ")
}

export function accountingTreatmentLabel(value?: string) {
  if (!value) return "-"
  return ACCOUNTING_TREATMENT_LABELS[value] ?? value.replace(/-/g, " ")
}

export function costTypeLabel(value: string) {
  return COST_TYPE_LABELS[value] ?? value.replace(/-/g, " ")
}

export function formatDateTimePH(date: string | undefined | null) {
  if (!date) return "-"
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return "-"
  return parsed.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function auditActionLabel(action: TransactionAuditEvent["action"]) {
  if (action === "create") return "Created"
  if (action === "update") return "Updated"
  return "Deleted"
}

export function auditSummary(event: TransactionAuditEvent) {
  if (event.action === "create") return event.note ?? "Record was created."
  if (event.action === "delete") return event.note ?? "Record was deleted."

  const before = event.before
  const after = event.after
  if (!before || !after) return event.note ?? ""

  const changed = [
    before.transactionDate !== after.transactionDate ? "date" : null,
    before.payee !== after.payee ? "store/company" : null,
    before.category !== after.category ? "category" : null,
    Number(before.amount) !== Number(after.amount) ? "amount" : null,
    before.description !== after.description ? "description" : null,
    before.referenceId !== after.referenceId ? "receipt/OR" : null,
    before.profitCenter !== after.profitCenter ? "for" : null,
    before.expenseCategory !== after.expenseCategory ? "expense group" : null,
    before.accountingTreatment !== after.accountingTreatment ? "treatment" : null,
    before.costType !== after.costType ? "cost type" : null,
    before.metadata?.needsReview !== after.metadata?.needsReview ? "review flag" : null,
  ].filter(Boolean)

  return changed.length > 0 ? `Changed ${changed.join(", ")}.` : "Saved without field changes."
}
