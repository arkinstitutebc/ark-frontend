import type { PoLiquidation, PoLiquidationListItem, PurchaseOrder } from "./types"

export interface LiquidationOrder {
  po: PurchaseOrder
  liquidation?: PoLiquidation
}

export function groupLiquidationOrders(
  orders: PurchaseOrder[],
  liquidations: PoLiquidationListItem[]
) {
  const byPoId = new Map(liquidations.map(item => [item.liquidation.poId, item.liquidation]))
  const groups = {
    ready: [] as LiquidationOrder[],
    inReview: [] as LiquidationOrder[],
    upcoming: [] as LiquidationOrder[],
    completed: [] as LiquidationOrder[],
  }

  for (const po of orders) {
    if (po.status === "cancelled") continue
    const liquidation = byPoId.get(po.id)
    const item = { po, liquidation }
    if (po.status === "pending" || po.status === "confirmed") groups.upcoming.push(item)
    else if (liquidation?.status === "submitted") groups.inReview.push(item)
    else if (liquidation?.status === "approved" || po.status === "liquidated")
      groups.completed.push(item)
    else groups.ready.push(item)
  }

  return groups
}
