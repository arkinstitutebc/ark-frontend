import { expect, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "../auth-helper"
import { waitForReady } from "../helpers"
import { API_URL, PORTAL_URLS } from "../test-config"

const FINANCE_URL = PORTAL_URLS.finance

test.describe("Finance — Check Vouchers", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await requireBackend(testInfo)
    await loginAsAdmin(page)
  })

  test("creates independent payment items with balanced accounting lines", async ({ page }) => {
    const payee = `QA Voucher ${Date.now()}`
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${FINANCE_URL}/check-vouchers/create`)
    await waitForReady(page)

    await page.getByLabel("Voucher No.").fill("0003")
    await page.getByLabel("Payee").fill(payee)
    await page.getByLabel("Check No.").fill("QA-8936")
    await page
      .getByLabel("Payment item 1 description")
      .fill("1st of 24th installment Suzuki Carry Van for Mobile Training")
    await page.getByLabel("Payment item 1 amount").fill("750")
    await page.getByRole("button", { name: "Add line" }).nth(0).click()
    await page.getByLabel("Payment item 2 description").fill("Mobile training registration")
    await page.getByLabel("Payment item 2 amount").fill("250")
    await page.getByLabel("Debit line 1 account").fill("Vehicles")
    await page.getByLabel("Debit line 1 amount").fill("1000")
    await page.getByLabel("Credit line 1 amount").fill("1000")

    await expect(page.getByText("Balanced", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Save Voucher" }).click()
    await expect(page).toHaveURL(/\/check-vouchers$/)
    await expect(page.getByText("No. 0003", { exact: true }).first()).toBeVisible()
    await expect(page.locator("article").getByText(payee)).toBeVisible()

    const list = await page.request.get(
      `${API_URL}/api/finance/check-vouchers?search=${encodeURIComponent(payee)}`
    )
    expect(list.ok()).toBe(true)
    const data = (await list.json()) as {
      items: Array<{ id: string; payee: string; voucherNo: string }>
    }
    const created = data.items.find(item => item.payee === payee)
    expect(created?.voucherNo).toBe("0003")
    if (created) await page.request.delete(`${API_URL}/api/finance/check-vouchers/${created.id}`)
  })

  test("blocks save while payment and accounting totals differ", async ({ page }) => {
    await page.goto(`${FINANCE_URL}/check-vouchers/create`)
    await waitForReady(page)

    await page.getByLabel("Payee").fill("QA Unbalanced Voucher")
    await page.getByLabel("Payment item 1 description").fill("Training materials")
    await page.getByLabel("Payment item 1 amount").fill("1000")
    await page.getByLabel("Debit line 1 account").fill("Training Materials")
    await page.getByLabel("Debit line 1 amount").fill("900")
    await page.getByLabel("Credit line 1 amount").fill("900")

    await expect(page.getByText("Not balanced", { exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "Save Voucher" })).toBeDisabled()
  })
})
