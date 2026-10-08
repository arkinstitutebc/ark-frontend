import { expect, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "../auth-helper"
import { waitForReady } from "../helpers"
import { API_URL, PORTAL_URLS } from "../test-config"

const PROCUREMENT_URL = PORTAL_URLS.procurement

test.describe("Procurement — Purchase Requests and approval", () => {
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

  test("create form has expense hierarchy and items", async ({ page }) => {
    await page.goto(`${PROCUREMENT_URL}/pr/create`)
    await waitForReady(page)

    await expect(
      page.getByRole("heading", { name: /New Purchase Request|Create.*Request/i }).first()
    ).toBeVisible()

    await expect(page.getByRole("combobox", { name: "Expense type" })).toBeVisible()
    await expect(page.getByRole("combobox", { name: "Operations type" })).toBeVisible()
    await expect(page.getByRole("combobox", { name: "Batch" })).toBeVisible()
    await expect(page.getByRole("combobox", { name: "Expense item" })).toBeVisible()

    // Items + Specification/Remarks fields per row (shipped in bucket 1 polish)
    await expect(page.getByPlaceholder(/Item name|description/i).first()).toBeVisible()
    await expect(page.getByPlaceholder(/Specification|Details/i).first()).toBeVisible()
  })

  test("approvals page shows one pending queue", async ({ page }) => {
    await page.goto(`${PROCUREMENT_URL}/approvals`)
    await waitForReady(page)

    await expect(page.getByRole("heading", { name: /Approvals/i }).first()).toBeVisible()
    await expect(page.getByText("Pending approval")).toBeVisible()
  })

  test("trainer submits a classified PR and sees confirmation", async ({ page }) => {
    if (!["localhost", "127.0.0.1"].includes(new URL(API_URL).hostname)) {
      throw new Error("Trainer PR E2E must run against a local disposable database")
    }
    const stamp = Date.now()
    const label = `E2E Asset ${stamp}`
    const overheadLabel = `E2E Overhead ${stamp}`
    const purpose = `E2E trainer PR ${stamp}`
    let expenseItemId: string | undefined
    let overheadItemId: string | undefined
    let trainerId: string | undefined
    let prId: string | undefined

    try {
      const itemResponse = await page.request.post(`${API_URL}/api/procurement/expense-items`, {
        data: {
          code: `E2E_ASSET_${stamp}`,
          label,
          expenseType: "assets",
          operationsSubtype: null,
          defaultExpenseCategory: "fixed-asset",
          defaultAccountingTreatment: "capital",
        },
      })
      expect(itemResponse.status()).toBe(201)
      expenseItemId = ((await itemResponse.json()) as { id: string }).id
      const overheadResponse = await page.request.post(`${API_URL}/api/procurement/expense-items`, {
        data: {
          code: `E2E_OVERHEAD_${stamp}`,
          label: overheadLabel,
          expenseType: "operations",
          operationsSubtype: "company_overhead",
          defaultExpenseCategory: "admin-expense",
          defaultAccountingTreatment: "common-overhead",
        },
      })
      expect(overheadResponse.status()).toBe(201)
      overheadItemId = ((await overheadResponse.json()) as { id: string }).id

      const invite = await page.request.post(`${API_URL}/api/admin/users`, {
        data: {
          email: `qa+pr-${stamp}@arkinstitutebc.com`,
          firstName: "E2E",
          lastName: "Trainer",
          role: "trainer",
        },
      })
      expect(invite.status()).toBe(201)
      const invited = (await invite.json()) as {
        user: { id: string; email: string }
        tempPassword: string
      }
      trainerId = invited.user.id
      await page.request.post(`${API_URL}/api/auth/logout`)
      const login = await page.request.post(`${API_URL}/api/auth/login`, {
        data: { email: invited.user.email, password: invited.tempPassword },
      })
      expect(login.status()).toBe(200)
      const password = `E2eTrainer-${stamp}!`
      const changed = await page.request.post(`${API_URL}/api/auth/change-password`, {
        data: { oldPassword: invited.tempPassword, newPassword: password },
      })
      expect(changed.status()).toBe(200)
      await page.request.post(`${API_URL}/api/auth/login`, {
        data: { email: invited.user.email, password },
      })

      await page.goto(`${PROCUREMENT_URL}/pr/create`)
      await waitForReady(page)
      await page.getByRole("combobox", { name: "Expense type" }).click()
      await page.getByRole("option", { name: "Assets" }).click()
      await page.getByRole("combobox", { name: "Expense item" }).click()
      await page.getByRole("option", { name: label }).click()
      await page
        .locator("#pr-date-needed")
        .fill(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
      await page.locator("#pr-purpose").fill(purpose)
      await page
        .getByPlaceholder(/Item name|description/i)
        .first()
        .fill("Training tool")
      await page.getByRole("spinbutton", { name: "Unit Price (P)" }).fill("1")
      await page.getByRole("button", { name: "Submit Request" }).click()
      await expect(page.getByText("Request submitted", { exact: true })).toBeVisible()

      const list = await page.request.get(`${API_URL}/api/procurement/requests?search=${stamp}`)
      expect(list.status()).toBe(200)
      const body = (await list.json()) as {
        items: { id: string; purpose: string; status: string; createdBy: string }[]
      }
      const created = body.items.find(item => item.purpose === purpose)
      expect(created?.status).toBe("pending")
      expect(created?.createdBy).toBe(invited.user.email)
      prId = created?.id
      if (!prId) throw new Error("Trainer PR was not returned by the API")

      await page.goto(`${PROCUREMENT_URL}/pr/${prId}/edit`)
      await waitForReady(page)
      await expect(page.getByRole("combobox", { name: "Expense item" })).toContainText(label)
      await page.getByRole("combobox", { name: "Expense type" }).click()
      await page.getByRole("option", { name: "Operations" }).click()
      await page.getByRole("combobox", { name: "Operations type" }).click()
      await page.getByRole("option", { name: "Company Overhead" }).click()
      await page.getByRole("combobox", { name: "Expense item" }).click()
      await page.getByRole("option", { name: overheadLabel }).click()
      await page.locator("#pr-edit-purpose").fill(`${purpose} updated`)
      await page.getByRole("button", { name: "Save Changes" }).click()
      await expect(page.getByText("Request updated", { exact: true })).toBeVisible()
      await expect
        .poll(async () => {
          const response = await page.request.get(`${API_URL}/api/procurement/requests/${prId}`)
          const updated = (await response.json()) as {
            purpose: string
            expenseItemId: string
            operationsSubtype: string
          }
          return (
            updated.purpose === `${purpose} updated` &&
            updated.expenseItemId === overheadItemId &&
            updated.operationsSubtype === "company_overhead"
          )
        })
        .toBe(true)
    } finally {
      await loginAsAdmin(page)
      if (prId) await page.request.delete(`${API_URL}/api/procurement/requests/${prId}`)
      if (trainerId) await page.request.post(`${API_URL}/api/admin/users/${trainerId}/deactivate`)
      if (expenseItemId) {
        await page.request.put(`${API_URL}/api/procurement/expense-items/${expenseItemId}`, {
          data: { active: false },
        })
      }
      if (overheadItemId) {
        await page.request.put(`${API_URL}/api/procurement/expense-items/${overheadItemId}`, {
          data: { active: false },
        })
      }
    }
  })
})
