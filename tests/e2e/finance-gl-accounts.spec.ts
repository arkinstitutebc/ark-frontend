import { expect, test } from "@playwright/test"
import { waitForReady } from "./helpers"

const FINANCE_URL = "http://localhost:3004"

test.describe("Finance — GL Accounts admin", () => {
  test("renders sectioned table with seeded categories", async ({ page }) => {
    await page.goto(`${FINANCE_URL}/gl-accounts`)
    await waitForReady(page)

    await expect(page.getByRole("heading", { name: "GL Accounts", exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: /New Account/i })).toBeVisible()

    // The 4 active sections from the 20-row seed
    await expect(page.getByRole("heading", { name: "Cost of Services" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Admin Expense" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Fixed Asset" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Other" })).toBeVisible()

    // A handful of seeded labels (matching `Accounting_Treatment.csv`)
    await expect(page.getByText("Internet Allowance")).toBeVisible()
    await expect(page.getByText("Salaries & Wages")).toBeVisible()
    await expect(page.getByText("Training Tools & Equipment")).toBeVisible()
  })

  test("create modal opens with the right fields", async ({ page }) => {
    await page.goto(`${FINANCE_URL}/gl-accounts`)
    await waitForReady(page)

    await page.getByRole("button", { name: /New Account/i }).click()

    await expect(page.getByRole("heading", { name: "New GL Account" })).toBeVisible()
    await expect(page.getByLabel("Code")).toBeVisible()
    await expect(page.getByLabel("Label")).toBeVisible()
    await expect(page.getByText("Section", { exact: true }).first()).toBeVisible()
    await expect(page.getByText(/Default Expense Category/i)).toBeVisible()
    await expect(page.getByText(/Default Treatment/i)).toBeVisible()
  })
})
