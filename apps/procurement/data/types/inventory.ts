export type StockStatus = "in-stock" | "low-stock" | "out-of-stock"

export interface StockItem {
  id: string
  batchId: string
  batchCode: string
  batchName: string
  poReference?: string
  name: string
  category: string
  unit: string
  quantityOnHand: number
  reorderLevel: number
  status: StockStatus
  lastUpdated: string
}

export interface StockReceipt {
  id: string
  poId: string
  poReference: string
  batchId: string
  batchCode: string
  batchName: string
  items: {
    itemId: string
    itemName: string
    quantityOrdered: number
    quantityReceived: number
  }[]
  receivedDate: string
  receivedBy: string
  notes?: string
}

export interface StockMovement {
  id: string
  itemId: string
  itemName: string
  batchId: string
  batchCode: string
  type: "in" | "out" | "adjustment"
  quantity: number
  reference?: string // PO ID, adjustment ID, etc.
  reason?: string
  createdAt: string
  createdBy: string
}
