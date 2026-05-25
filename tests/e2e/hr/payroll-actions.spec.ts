import { expect, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "../auth-helper"
import { waitForReady } from "../helpers"
import { API_URL, PORTAL_URLS } from "../test-config"

interface PayrollPeriod {
  id: string
  status: string
}

test.describe("HR payroll actions", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await requireBackend(testInfo)
    await loginAsAdmin(page)
  })

  test("process payroll action surfaces success or payable-attendance guard", async ({
    page,
  }, testInfo) => {
    const res = await page.request.get(`${API_URL}/api/hr/payroll`)
    expect(res.status()).toBe(200)
    const periods = (await res.json()) as PayrollPeriod[]
    const draft = periods.find(period => period.status === "draft")
    testInfo.skip(!draft, "No draft payroll period available for payroll action E2E")

    await page.goto(`${PORTAL_URLS.hr}/payroll/${draft.id}`)
    await waitForReady(page)

    await page.getByRole("button", { name: /^process payroll$/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByText("Process Payroll")).toBeVisible()
    await dialog.getByRole("button", { name: /^process payroll$/i }).click()

    await expect(
      page.getByText(/payroll processed|no payable trainer attendance found/i)
    ).toBeVisible()
  })
})
