import { describe, expect, test } from "bun:test"
import { createPrSchema } from "../../apps/procurement/data/schemas"

const expenseItemId = "11111111-1111-4111-8111-111111111111"
const batchId = "22222222-2222-4222-8222-222222222222"
const item = { name: "Laptop", quantity: 1, unit: "pcs", unitPrice: 1000 }
const base = {
  expenseItemId,
  purpose: "Training equipment",
  dateNeeded: "2026-10-01",
  items: [item],
}

describe("purchase request form validation", () => {
  test("assets do not require a batch", () => {
    expect(createPrSchema.safeParse({ ...base, expenseType: "assets" }).success).toBe(true)
  })

  test("training expenses require a valid batch ID", () => {
    const training = {
      ...base,
      expenseType: "operations",
      operationsSubtype: "training_expense",
    }
    expect(createPrSchema.safeParse(training).success).toBe(false)
    expect(createPrSchema.safeParse({ ...training, batchId: "" }).success).toBe(false)
    expect(createPrSchema.safeParse({ ...training, batchId }).success).toBe(true)
  })

  test("rejects an incomplete item instead of silently dropping it", () => {
    const result = createPrSchema.safeParse({
      ...base,
      expenseType: "assets",
      items: [item, { name: "", quantity: 1, unit: "pcs", unitPrice: 0 }],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.path.join(".") === "items.1.name")).toBe(true)
    }
  })

  test("rejects impossible dates before submission", () => {
    expect(
      createPrSchema.safeParse({ ...base, expenseType: "assets", dateNeeded: "2026-02-31" }).success
    ).toBe(false)
  })
})
