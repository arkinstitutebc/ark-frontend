import type { Asset, AssetStatus, PrAttachment } from "@ark/data-types"
import { createCrudHooks, toast } from "@ark/ui"
import { createMutation, useQueryClient } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"

export interface CreateAssetInput {
  name: string
  category: string
  description?: string
  acquisitionDate: string
  acquisitionCost: string
  residualValue?: string
  usefulLifeMonths: number
  depreciationMethod?: "straight-line"
  profitCenter?: string
  assignedTo?: string
  location?: string
  serialNo?: string
  linkedPrCode?: string
  linkedDisbursementId?: string
  notes?: string
  attachments?: PrAttachment[]
}

export type UpdateAssetInput = Partial<CreateAssetInput>

export interface ListAssetsQuery {
  status?: AssetStatus
  category?: string
  profitCenter?: string
}

const crud = createCrudHooks<Asset, Asset, CreateAssetInput, UpdateAssetInput, ListAssetsQuery>({
  basePath: "/api/finance/assets",
  domain: "assets",
  label: "Asset",
  messages: { create: "Asset registered", update: "Asset updated" },
  queryKeys: {
    all: queryKeys.assets.all,
    list: q => queryKeys.assets.filtered(q),
    detail: id => queryKeys.assets.detail(id),
  },
})

export const useAssets = crud.useList
export const useAsset = crud.useOne
export const useCreateAsset = crud.useCreate
export const useUpdateAsset = crud.useUpdate

export interface DisposeAssetInput {
  disposalDate: string
  disposalProceeds?: string
  notes?: string
}

export function useDisposeAsset() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: ({ id, ...data }: { id: string } & DisposeAssetInput) =>
      api<Asset>(`/api/finance/assets/${id}/dispose`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_d, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.assets.all })
      if (variables.id) qc.invalidateQueries({ queryKey: queryKeys.assets.detail(variables.id) })
      toast.success("Asset disposed")
    },
    onError: (err: Error) => toast.error(err.message),
  }))
}
