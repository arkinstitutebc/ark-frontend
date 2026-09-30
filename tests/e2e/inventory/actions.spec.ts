import { expect, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "../auth-helper"
import { waitForReady } from "../helpers"
import { API_URL, PORTAL_URLS } from "../test-config"

interface StockItem {
  id: string
  name: string
  quantityOnHand: number
}

const DEMO_INVENTORY_ITEM_NAME = "[DEMO] Inventory Action Kit"

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
    await dialog.getByRole("combobox", { name: /adjustment reason/i }).click()
    await page.getByRole("option", { name: "Count Correction", exact: true }).click()
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

  test("monthly toolkeeping lists generated checklists", async ({ page }) => {
    await page.goto(`${PORTAL_URLS.inventory}/monthly`)
    await waitForReady(page)
    await expect(page.getByRole("heading", { name: "Monthly Toolkeeping" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Generate checklist" })).toBeVisible()
  })
})
