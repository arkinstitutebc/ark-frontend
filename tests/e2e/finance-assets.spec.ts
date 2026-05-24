import { expect, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "./auth-helper"
import { waitForReady } from "./helpers"

const FINANCE_URL = "http://localhost:3004"
const API_URL = process.env.VITE_API_URL || "http://localhost:4000"

test.describe("Finance — Asset Register", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await requireBackend(testInfo)
    await loginAsAdmin(page)
  })

  test("list page renders chrome + stat cards + empty state", async ({ page }) => {
    await page.goto(`${FINANCE_URL}/assets`)
    await waitForReady(page)

    await expect(page.getByRole("heading", { name: /Asset Register/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /Register Asset/i })).toBeVisible()

    // Stat cards: Active assets / Total cost / Book value
    await expect(page.getByText("Active assets")).toBeVisible()
    await expect(page.getByText(/Total cost/i)).toBeVisible()
    await expect(page.getByText("Book value (today)")).toBeVisible()

    // Filter chips
    await expect(page.getByRole("button", { name: "All", exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "Active", exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "Disposed", exact: true })).toBeVisible()
  })

  test("create page form renders + fixed-asset categories populate", async ({ page }) => {
    await page.goto(`${FINANCE_URL}/assets/create`)
    await waitForReady(page)

    await expect(page.getByRole("heading", { name: /Register Asset/i })).toBeVisible()

    // Required fields visible
    await expect(page.getByText("Name")).toBeVisible()
    await expect(page.getByRole("combobox", { name: "Category" })).toBeVisible()
    await expect(page.getByText(/Acquisition Cost/i)).toBeVisible()
    await expect(page.getByText("Useful Life (months)*")).toBeVisible()

    // Useful-life quick-set presets
    await expect(page.getByRole("button", { name: /^3 years$/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /^5 years$/i })).toBeVisible()

    // Depreciation preview panel
    await expect(page.getByText(/Depreciation Preview/i)).toBeVisible()
    await expect(page.getByText("Monthly depreciation", { exact: true })).toBeVisible()
  })

  test("prefill from disbursement banner shows when fromDisbursement query param is present", async ({
    page,
  }) => {
    await page.goto(
      `${FINANCE_URL}/assets/create?fromDisbursement=00000000-0000-0000-0000-000000000000&name=Test+Laptop&cost=50000&category=office_equipment&date=2026-03-01`
    )
    await waitForReady(page)

    await expect(page.getByText(/Prefilled from a fixed-asset disbursement/i)).toBeVisible()
    // Name field prefilled
    await expect(page.locator('input[type="text"]').first()).toHaveValue("Test Laptop")
  })

  test("create form blocks residual value above acquisition cost", async ({ page }) => {
    await page.goto(`${FINANCE_URL}/assets/create`)
    await waitForReady(page)

    await page.locator('input[type="text"]').first().fill("QA Residual Guard")
    const numberInputs = page.locator('input[type="number"]')
    await numberInputs.nth(0).fill("100")
    await numberInputs.nth(1).fill("150")
    await page.getByRole("button", { name: /register asset/i }).click()

    await expect(page.getByText(/cannot exceed acquisition cost/i)).toBeVisible()
  })

  test("dispose modal blocks disposal before acquisition date", async ({ page }) => {
    const created = await page.request.post(`${API_URL}/api/finance/assets`, {
      data: {
        name: `QA Dispose Guard ${Date.now()}`,
        category: "office_equipment",
        acquisitionDate: "2026-03-15",
        acquisitionCost: "1200.00",
        residualValue: "100.00",
        usefulLifeMonths: 12,
        profitCenter: "Admin",
      },
    })
    expect(created.status()).toBe(201)
    const asset = await created.json()

    await page.goto(`${FINANCE_URL}/assets/${asset.id}`)
    await waitForReady(page)

    await page.getByRole("button", { name: /dispose/i }).click()
    const dialog = page.getByText("Dispose Asset").locator("..")
    await dialog.locator('input[type="date"]').fill("2026-03-01")
    await dialog.getByRole("button", { name: /^dispose$/i }).click()

    await expect(page.getByText(/disposal date cannot be before acquisition date/i)).toBeVisible()
  })
})
