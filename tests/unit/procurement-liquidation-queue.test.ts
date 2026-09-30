import { describe, expect, test } from "bun:test"
import { groupLiquidationOrders } from "../../apps/procurement/data/liquidation-queue"
import type {
  PoLiquidation,
  PoLiquidationListItem,
  PurchaseOrder,
} from "../../apps/procurement/data/types"

function po(id: string, status: PurchaseOrder["status"]): PurchaseOrder {
  return { id, status, poCode: id, prId: id, items: [], totalAmount: 100, createdAt: "2026-10-01" }
}

function liquidation(poId: string, status: PoLiquidation["status"]): PoLiquidationListItem {
  return {
    liquidation: {
      id: `liq-${poId}`,
      poId,
      status,
      actualAmount: 100,
      varianceAmount: 0,
      receipts: [],
      submittedAt: "2026-10-01",
    },
    purchaseOrder: po(poId, "acknowledged"),
    purchaseRequest: {} as PoLiquidationListItem["purchaseRequest"],
  }
}

describe("liquidation queue", () => {
  test("shows unsubmitted and rejected acknowledged POs as ready", () => {
    const groups = groupLiquidationOrders(
      [po("new", "acknowledged"), po("rejected", "acknowledged")],
      [liquidation("rejected", "rejected")]
    )
    expect(groups.ready.map(item => item.po.id)).toEqual(["new", "rejected"])
  })

  test("keeps upcoming, review, and completed POs visible without cancelled ones", () => {
    const groups = groupLiquidationOrders(
      [
        po("pending", "pending"),
        po("confirmed", "confirmed"),
        po("review", "acknowledged"),
        po("done", "liquidated"),
        po("cancelled", "cancelled"),
      ],
      [liquidation("review", "submitted"), liquidation("done", "approved")]
    )
    expect(groups.upcoming.map(item => item.po.id)).toEqual(["pending", "confirmed"])
    expect(groups.inReview.map(item => item.po.id)).toEqual(["review"])
    expect(groups.completed.map(item => item.po.id)).toEqual(["done"])
    expect(
      Object.values(groups)
        .flat()
        .some(item => item.po.id === "cancelled")
    ).toBe(false)
  })
})
