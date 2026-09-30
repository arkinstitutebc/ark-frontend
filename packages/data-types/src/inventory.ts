export type StockStatus = "in-stock" | "low-stock" | "out-of-stock"

export interface StockItem {
  id: string
  name: string
  category: string
  unit: string
  assetTag?: string | null
  serialNumber?: string | null
  unitPrice: number | string
  trackingMode: "quantity" | "individual"
  condition: "good" | "damaged" | "for-repair" | "lost"
  damagedQuantity: number
  quantityOnHand: number
  reorderLevel: number
  status: StockStatus
  lastUpdated: string
}

export interface MonthlyToolkeepingReport {
  id: string
  month: string
  status: "open" | "completed"
  notes?: string | null
  completedAt?: string | null
  createdAt: string
}

export interface MonthlyToolkeepingLine {
  line: {
    id: string
    reportId: string
    itemId: string
    expectedQuantity: number
    countedQuantity?: number | null
    damagedQuantity: number
    condition: StockItem["condition"]
    notes?: string | null
  }
  item: StockItem
}

export interface StockMovement {
  id: string
  itemId: string
  itemName: string
  type: "in" | "out" | "adjustment"
  quantity: number
  reference?: string // Monthly checklist or other adjustment reference.
  reason?: string
  createdAt: string
  createdBy: string
}
