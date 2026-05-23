import type { PrAttachment } from "./procurement"

export type AssetStatus = "active" | "disposed" | "written-off"

export interface Asset {
  id: string
  assetCode: string
  name: string
  category: string
  description?: string | null
  acquisitionDate: string
  acquisitionCost: string
  residualValue: string
  usefulLifeMonths: number
  depreciationMethod: string
  profitCenter?: string | null
  assignedTo?: string | null
  location?: string | null
  serialNo?: string | null
  linkedPrCode?: string | null
  linkedDisbursementId?: string | null
  notes?: string | null
  attachments?: PrAttachment[] | null
  status: AssetStatus
  disposalDate?: string | null
  disposalProceeds?: string | null
  createdBy?: string | null
  createdAt: string
  updatedAt: string
}
