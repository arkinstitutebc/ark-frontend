import { expect, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "./auth-helper"
import { waitForReady } from "./helpers"
import { API_URL, PORTAL_URLS } from "./test-config"

const FINANCE_URL = PORTAL_URLS.finance

async function createGlFixture(page: import("@playwright/test").Page, seed: string) {
  const rows = [
    {
      code: `e2e_cos_${seed}`,
      label: "Training Tools & Equipment",
      section: "cost-of-services",
      defaultExpenseCategory: "cost-of-services",
      defaultAccountingTreatment: "variable",
      sortOrder: 10,
    },
    {
      code: `e2e_adm_${seed}`,
      label: "Internet Allowance",
      section: "admin-expense",
      defaultExpenseCategory: "admin-expense",
      defaultAccountingTreatment: "common-overhead",
      sortOrder: 20,
    },
    {
      code: `e2e_ast_${seed}`,
      label: "Training Tools Asset",
      section: "fixed-asset",
      defaultExpenseCategory: "fixed-asset",
      defaultAccountingTreatment: "capital",
      sortOrder: 30,
    },
    {
      code: `e2e_oth_${seed}`,
      label: "Other E2E Expense",
      section: "other",
      defaultExpenseCategory: null,
      defaultAccountingTreatment: null,
      sortOrder: 40,
    },
  ]

  for (const row of rows) {
    const res = await page.request.post(`${API_URL}/api/finance/gl-accounts`, {
      data: row,
      failOnStatusCode: false,
    })
    expect([201, 409]).toContain(res.status())
  }
}

test.describe("Finance — GL Accounts admin", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await requireBackend(testInfo)
    await loginAsAdmin(page)
  })

  test("renders sectioned table with seeded categories", async ({ page }) => {
    await createGlFixture(page, String(Date.now()).slice(-6))
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
    await expect(page.getByRole("cell", { name: "Internet Allowance" }).first()).toBeVisible()
    await expect(
      page.getByRole("cell", { name: "Training Tools & Equipment" }).first()
    ).toBeVisible()
  })

  test("create modal opens with the right fields", async ({ page }) => {
    await page.goto(`${FINANCE_URL}/gl-accounts`)
    await waitForReady(page)

    await page.getByRole("button", { name: /New Account/i }).click()

    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("heading", { name: "New GL Account" })).toBeVisible()
    await expect(dialog.getByLabel("Code")).toBeVisible()
    await expect(dialog.getByLabel("Label")).toBeVisible()
    await expect(dialog.getByText("Section", { exact: true })).toBeVisible()
    await expect(dialog.getByText(/Default Expense Category/i)).toBeVisible()
    await expect(dialog.getByText(/Default Treatment/i)).toBeVisible()
  })
})
