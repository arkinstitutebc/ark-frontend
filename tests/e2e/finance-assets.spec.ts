import { expect, test } from "@playwright/test"
import { waitForReady } from "./helpers"

const FINANCE_URL = "http://localhost:3004"

test.describe("Finance — Asset Register", () => {
  test("list page renders chrome + stat cards + empty state", async ({ page }) => {
    await page.goto(`${FINANCE_URL}/assets`)
    await waitForReady(page)

    await expect(page.getByRole("heading", { name: /Asset Register/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /Register Asset/i })).toBeVisible()

    // Stat cards: Active assets / Total cost / Book value
    await expect(page.getByText("Active assets")).toBeVisible()
    await expect(page.getByText(/Total cost/i)).toBeVisible()
    await expect(page.getByText(/Book value/i)).toBeVisible()

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
    await expect(page.getByText("Category", { exact: true }).first()).toBeVisible()
    await expect(page.getByText(/Acquisition Cost/i)).toBeVisible()
    await expect(page.getByText(/Useful Life/i)).toBeVisible()

    // Useful-life quick-set presets
    await expect(page.getByRole("button", { name: /^3 years$/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /^5 years$/i })).toBeVisible()

    // Depreciation preview panel
    await expect(page.getByText(/Depreciation Preview/i)).toBeVisible()
    await expect(page.getByText(/Monthly depreciation/i)).toBeVisible()
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
})
