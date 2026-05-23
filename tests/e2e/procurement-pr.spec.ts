import { expect, test } from "@playwright/test"
import { waitForReady } from "./helpers"

const PROCUREMENT_URL = "http://localhost:3002"

test.describe("Procurement — Purchase Requests + 3-sig workflow", () => {
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
    await expect(page.getByText("Profit Center", { exact: true }).first()).toBeVisible()
    await expect(page.getByText("Accounting Treatment").first()).toBeVisible()
    await expect(page.getByText("Cost Type", { exact: true }).first()).toBeVisible()

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
