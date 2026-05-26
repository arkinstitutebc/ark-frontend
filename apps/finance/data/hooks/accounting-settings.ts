import { createCrudHooks } from "@ark/ui"
import { queryKeys } from "../query-keys"

export interface ProfitCenterSetting {
  id: string
  code: string
  label: string
  segmentGroup?: string | null
  fundSource?: string | null
  notes?: string | null
  sortOrder: number
  active: boolean
}

export interface TrainingOfferingSetting {
  id: string
  code: string
  label: string
  sector?: string | null
  notes?: string | null
  sortOrder: number
  active: boolean
}

export interface ClassificationRuleSetting {
  id: string
  glAccountCode: string
  profitCenterCode?: string | null
  defaultExpenseCategory?: string | null
  defaultAccountingTreatment?: string | null
  defaultCostType?: string | null
  defaultAssetCategory?: string | null
  defaultUsefulLifeMonths?: number | null
  requiresAssetReview: boolean
  notes?: string | null
  sortOrder: number
  active: boolean
}

interface SettingsQuery {
  includeInactive?: boolean
}

export type CreateProfitCenterInput = Omit<ProfitCenterSetting, "id" | "sortOrder" | "active"> & {
  sortOrder?: number
  active?: boolean
}
export type UpdateProfitCenterInput = Partial<CreateProfitCenterInput>

export type CreateTrainingOfferingInput = Omit<
  TrainingOfferingSetting,
  "id" | "sortOrder" | "active"
> & {
  sortOrder?: number
  active?: boolean
}
export type UpdateTrainingOfferingInput = Partial<CreateTrainingOfferingInput>

export type CreateClassificationRuleInput = Omit<
  ClassificationRuleSetting,
  "id" | "sortOrder" | "active" | "requiresAssetReview"
> & {
  sortOrder?: number
  active?: boolean
  requiresAssetReview?: boolean
}
export type UpdateClassificationRuleInput = Partial<CreateClassificationRuleInput>

const profitCenterCrud = createCrudHooks<
  ProfitCenterSetting,
  ProfitCenterSetting,
  CreateProfitCenterInput,
  UpdateProfitCenterInput,
  SettingsQuery
>({
  basePath: "/api/finance/settings/profit-centers",
  domain: "profit-centers",
  label: "Profit center",
  queryKeys: {
    all: ["accounting-settings", "profit-centers"] as const,
    list: q => queryKeys.accountingSettings.profitCenters(q),
    detail: id => ["accounting-settings", "profit-centers", id] as const,
  },
})

const trainingOfferingCrud = createCrudHooks<
  TrainingOfferingSetting,
  TrainingOfferingSetting,
  CreateTrainingOfferingInput,
  UpdateTrainingOfferingInput,
  SettingsQuery
>({
  basePath: "/api/finance/settings/training-offerings",
  domain: "training-offerings",
  label: "Training offering",
  queryKeys: {
    all: ["accounting-settings", "training-offerings"] as const,
    list: q => queryKeys.accountingSettings.trainingOfferings(q),
    detail: id => ["accounting-settings", "training-offerings", id] as const,
  },
})

const classificationRuleCrud = createCrudHooks<
  ClassificationRuleSetting,
  ClassificationRuleSetting,
  CreateClassificationRuleInput,
  UpdateClassificationRuleInput,
  SettingsQuery
>({
  basePath: "/api/finance/settings/classification-rules",
  domain: "classification-rules",
  label: "Classification rule",
  queryKeys: {
    all: ["accounting-settings", "classification-rules"] as const,
    list: q => queryKeys.accountingSettings.classificationRules(q),
    detail: id => ["accounting-settings", "classification-rules", id] as const,
  },
})

export const useProfitCenters = profitCenterCrud.useList
export const useCreateProfitCenter = profitCenterCrud.useCreate
export const useUpdateProfitCenter = profitCenterCrud.useUpdate

export const useTrainingOfferings = trainingOfferingCrud.useList
export const useCreateTrainingOffering = trainingOfferingCrud.useCreate
export const useUpdateTrainingOffering = trainingOfferingCrud.useUpdate

export const useClassificationRules = classificationRuleCrud.useList
export const useCreateClassificationRule = classificationRuleCrud.useCreate
export const useUpdateClassificationRule = classificationRuleCrud.useUpdate
