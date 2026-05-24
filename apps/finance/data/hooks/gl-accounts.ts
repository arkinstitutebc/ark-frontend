import type { GlAccount, GlAccountSection } from "@ark/data-types"
import { createCrudHooks } from "@ark/ui"
import { queryKeys } from "../query-keys"

export interface CreateGlAccountInput {
  code: string
  label: string
  section: GlAccountSection
  defaultExpenseCategory?: string | null
  defaultAccountingTreatment?: string | null
  notes?: string
  sortOrder?: number
  active?: boolean
}

export interface UpdateGlAccountInput {
  code?: string
  label?: string
  section?: GlAccountSection
  defaultExpenseCategory?: string | null
  defaultAccountingTreatment?: string | null
  notes?: string
  sortOrder?: number
  active?: boolean
}

export interface ListGlAccountsQuery {
  includeInactive?: boolean
}

const crud = createCrudHooks<
  GlAccount,
  GlAccount,
  CreateGlAccountInput,
  UpdateGlAccountInput,
  ListGlAccountsQuery
>({
  basePath: "/api/finance/gl-accounts",
  domain: "gl-accounts",
  label: "GL Account",
  messages: {
    create: "GL account added",
    delete: "GL account deactivated",
  },
  queryKeys: {
    all: queryKeys.glAccounts.all,
    list: q => queryKeys.glAccounts.filtered(q),
    detail: id => queryKeys.glAccounts.detail(id),
  },
})

export const useGlAccounts = crud.useList
export const useCreateGlAccount = crud.useCreate
export const useUpdateGlAccount = crud.useUpdate
export const useDeactivateGlAccount = crud.useDelete
