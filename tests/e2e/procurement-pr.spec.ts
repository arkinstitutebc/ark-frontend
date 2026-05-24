import { expect, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "./auth-helper"
import { waitForReady } from "./helpers"
import { PORTAL_URLS } from "./test-config"

const PROCUREMENT_URL = PORTAL_URLS.procurement

test.describe("Procurement — Purchase Requests + 3-sig workflow", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await requireBackend(testInfo)
    await loginAsAdmin(page)
  })

  test("PR list renders chrome + filters", async ({ page }) => {
    await page.goto(`${PROCUREMENT_URL}/`)
    await waitForReady(page)

    await expect(page.getByRole("heading", { name: /Purchase Requests/i }).first()).toBeVisible()
    // Common status filter chips
    await expect(page.getByRole("button", { name: /^all$/i }).first()).toBeVisible()
  })

  test("create form has all 4 classification dropdowns + items section", async ({ page }) => {
    await page.goto(`${PROCUREMENT_URL}/pr/create`)
    await waitForReady(page)

    await expect(
      page.getByRole("heading", { name: /New Purchase Request|Create.*Request/i }).first()
    ).toBeVisible()

    // 4-axis accounting classification — feature #3 dropdowns
    await expect(page.getByText("Expense Category").first()).toBeVisible()
    await expect(page.getByRole("combobox", { name: "Profit Center" })).toBeVisible()
    await expect(page.getByText("Accounting Treatment").first()).toBeVisible()
    await expect(page.getByRole("combobox", { name: "Cost Type" })).toBeVisible()

    // Items + Specification/Remarks fields per row (shipped in bucket 1 polish)
    await expect(page.getByPlaceholder(/Item name|description/i).first()).toBeVisible()
    await expect(page.getByPlaceholder(/Specification|Details/i).first()).toBeVisible()
  })

  test("approvals page shows two-queue split (Coordinator + Management)", async ({ page }) => {
    await page.goto(`${PROCUREMENT_URL}/approvals`)
    await waitForReady(page)

    await expect(page.getByRole("heading", { name: /Approvals/i }).first()).toBeVisible()
    // 3-sig workflow surfaces two queues
    await expect(page.getByText(/Coordinator queue/i).first()).toBeVisible()
    await expect(page.getByText(/Management queue/i).first()).toBeVisible()
  })
})
