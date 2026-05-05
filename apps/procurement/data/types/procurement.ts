export type PrStatus = "pending" | "approved" | "rejected" | "ordered"

export interface PrItem {
  id: string
  name: string
  quantity: number
  unit: string
  unitPrice: number
  total: number
}

export interface PurchaseRequest {
  id: string
  prCode: string
  batchId: string
  batchName: string
  batchCode: string
  category: string
  purpose: string
  items: PrItem[]
  totalAmount: number | string
  status: PrStatus
  createdBy: string
  createdAt: string
  approvedAt?: string
  approvedBy?: string
  approvalNotes?: string
}

export type PoStatus = "draft" | "sent" | "partial" | "received" | "cancelled"

export interface PurchaseOrder {
  id: string
  poCode: string
  prId: string
  batchId: string
  batchName: string
  supplier: string
  items: PrItem[]
  totalAmount: number | string
  status: PoStatus
  createdAt: string
  estimatedDelivery?: string
  actualDelivery?: string
  notes?: string
}
