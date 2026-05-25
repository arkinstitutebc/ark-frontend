import { expect, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "../auth-helper"
import { waitForReady } from "../helpers"
import { API_URL, PORTAL_URLS } from "../test-config"

interface StockItem {
  id: string
  name: string
  quantityOnHand: number
}

interface PurchaseOrder {
  id: string
  poCode: string
  status: string
}

const DEMO_INVENTORY_ITEM_NAME = "[DEMO] Inventory Action Kit"
const DEMO_PO_CODE = "PO-2026-DEMO-E2E"

async function firstStockItem(
  page: import("@playwright/test").Page,
  testInfo: import("@playwright/test").TestInfo
) {
  const res = await page.request.get(`${API_URL}/api/inventory/stock`)
  expect(res.status()).toBe(200)
  const items = (await res.json()) as StockItem[]
  const demoItem = items.find(item => item.name === DEMO_INVENTORY_ITEM_NAME)
  testInfo.skip(!demoItem, "Demo stock item unavailable; run backend db:seed:demo first")
  return demoItem
}

test.describe("Inventory actions", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await requireBackend(testInfo)
    await loginAsAdmin(page)
  })

  test("adjusts stock from the stock overview", async ({ page }, testInfo) => {
    const item = await firstStockItem(page, testInfo)

    await page.goto(`${PORTAL_URLS.inventory}/`)
    await waitForReady(page)
    await page.getByPlaceholder(/search items/i).fill(item.name)

    const row = page.getByRole("row").filter({ hasText: item.name }).first()
    await expect(row).toBeVisible()
    await row.getByRole("button", { name: /^adjust$/i }).click()

    const dialog = page.getByRole("dialog")
    await dialog.getByLabel(/adjustment amount/i).fill("1")
    await dialog.getByLabel(/reason/i).selectOption("correction")
    await dialog.getByRole("button", { name: /update stock/i }).click()

    await expect(dialog).toBeHidden()
    await expect
      .poll(async () => {
        const res = await page.request.get(`${API_URL}/api/inventory/stock/${item.id}`)
        const updated = (await res.json()) as StockItem
        return updated.quantityOnHand
      })
      .toBe(item.quantityOnHand + 1)
  })

  test("submits a stock count adjustment", async ({ page }, testInfo) => {
    const item = await firstStockItem(page, testInfo)

    await page.goto(`${PORTAL_URLS.inventory}/count`)
    await waitForReady(page)

    const row = page.getByRole("row").filter({ hasText: item.name }).first()
    await expect(row).toBeVisible()
    await row.locator('input[type="number"]').fill(String(item.quantityOnHand + 2))
    await page.getByRole("button", { name: /submit count/i }).click()

    await expect(page).toHaveURL(/\/movements/)
  })

  test("receives the seeded demo purchase order", async ({ page }, testInfo) => {
    const res = await page.request.get(`${API_URL}/api/procurement/orders`)
    expect(res.status()).toBe(200)
    const orders = (await res.json()) as PurchaseOrder[]
    const openOrder = orders.find(
      order =>
        order.poCode === DEMO_PO_CODE && (order.status === "sent" || order.status === "partial")
    )
    testInfo.skip(!openOrder, "Demo receiving PO unavailable; run backend db:seed:demo first")

    await page.goto(`${PORTAL_URLS.inventory}/receiving`)
    await waitForReady(page)

    await page.getByText(openOrder.poCode).click()
    await page
      .getByRole("row")
      .filter({ hasText: DEMO_INVENTORY_ITEM_NAME })
      .locator('input[type="number"]')
      .fill("1")
    await page.getByRole("button", { name: /complete receipt/i }).click()

    await expect(page.getByText(/receipt completed/i)).toBeVisible()
    await expect
      .poll(async () => {
        const nextRes = await page.request.get(`${API_URL}/api/procurement/orders`)
        expect(nextRes.status()).toBe(200)
        const nextOrders = (await nextRes.json()) as PurchaseOrder[]
        return nextOrders.find(order => order.poCode === DEMO_PO_CODE)?.status
      })
      .toBe("partial")
  })
})
