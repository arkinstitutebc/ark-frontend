export type GlAccountSection =
  | "cost-of-services"
  | "admin-expense"
  | "fixed-asset"
  | "revenue"
  | "other"

export interface GlAccount {
  id: string
  code: string
  label: string
  section: GlAccountSection
  defaultExpenseCategory?: string | null
  defaultAccountingTreatment?: string | null
  notes?: string | null
  sortOrder: number
  active: boolean
  createdAt: string
  updatedAt: string
}
