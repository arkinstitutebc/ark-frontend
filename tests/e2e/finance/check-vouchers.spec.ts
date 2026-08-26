import { expect, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "../auth-helper"
import { waitForReady } from "../helpers"
import { API_URL, PORTAL_URLS } from "../test-config"

const FINANCE_URL = PORTAL_URLS.finance
const HEART_ADMIN = {
  email: process.env.E2E_HEART_EMAIL || "heart@arkinstitutebc.com",
  password: process.env.E2E_HEART_PASSWORD || "changeme",
}

function voucherPayload(suffix: string, status: "draft" | "paid" | "void" = "draft") {
  return {
    voucherNo: `QA-${suffix}`,
    voucherDate: "2026-08-15",
    payee: `QA Voucher ${suffix}`,
    address: "Bacolod City",
    bankName: "Security Bank",
    checkNo: `CHECK-${suffix}`,
    paymentLines: [{ description: "Training materials", amount: 1000 }],
    debitLines: [{ account: "Training Materials", amount: 1000 }],
    creditLines: [{ account: "Cash in bank - SB", amount: 1000 }],
    preparedBy: "APRIL HEART A. ESCARO",
    approvedBy: "GEMMA A. ESCARO",
    status,
  }
}

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

  test("lets Heart edit a paid voucher and locks it after voiding", async ({ page }) => {
    const suffix = String(Date.now())
    const original = voucherPayload(suffix, "paid")
    await loginAsAdmin(page, HEART_ADMIN)
    const create = await page.request.post(`${API_URL}/api/finance/check-vouchers`, {
      data: original,
    })
    expect(create.ok()).toBe(true)
    const created = (await create.json()) as { id: string }

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${FINANCE_URL}/check-vouchers`)
    await waitForReady(page)
    await page.getByPlaceholder("Search voucher, payee, check no.").fill(original.payee)
    await expect(page.getByRole("button", { name: "Edit voucher" })).toBeVisible()
    await page.getByRole("button", { name: "Edit voucher" }).click()
    await expect(page).toHaveURL(new RegExp(`/check-vouchers/${created.id}/edit$`))
    await expect(page.getByText("This voucher is paid.", { exact: false })).toBeVisible()

    const updatedVoucherNo = `HEART-${suffix}`
    const updatedPayee = `Heart Updated ${suffix}`
    await page.getByLabel("Voucher No.").fill(updatedVoucherNo)
    await page.getByLabel("Payee").fill(updatedPayee)
    await page.getByLabel("Address").fill("Updated Bacolod address")
    await page.getByLabel("Bank Name").fill("Updated Security Bank")
    await page.getByLabel("Check No.").fill(`EDIT-${suffix}`)
    await page.getByLabel("Payment item 1 description").fill("Updated item with centavos")
    await page.getByLabel("Payment item 1 amount").fill("1000.25")
    await page.getByLabel("Debit line 1 account").fill("Updated debit account")
    await page.getByLabel("Debit line 1 amount").fill("1000.25")
    await page.getByLabel("Credit line 1 account").fill("Updated credit account")
    await page.getByLabel("Credit line 1 amount").fill("1000.25")
    await page.getByLabel("Received by").fill("Heart Escaro")
    await page.getByRole("button", { name: "Save Changes" }).click()
    await expect(page).toHaveURL(/\/check-vouchers$/)

    const saved = await page.request.get(`${API_URL}/api/finance/check-vouchers/${created.id}`)
    expect(saved.ok()).toBe(true)
    const voucher = (await saved.json()) as {
      voucherNo: string
      payee: string
      totalAmount: string
      status: string
    }
    expect(voucher).toMatchObject({
      voucherNo: updatedVoucherNo,
      payee: updatedPayee,
      status: "paid",
    })
    expect(Number(voucher.totalAmount)).toBe(1000.25)

    await page.getByPlaceholder("Search voucher, payee, check no.").fill(updatedPayee)
    await page
      .locator("article")
      .filter({ hasText: updatedPayee })
      .getByRole("button")
      .first()
      .click()
    await expect(page.getByText("Accounting Lines", { exact: true })).toBeVisible()
    await expect(page.getByText("Debit", { exact: true }).last()).toBeVisible()
    await expect(page.getByText("Credit", { exact: true }).last()).toBeVisible()

    await page.request.post(`${API_URL}/api/finance/check-vouchers/${created.id}/void`)
    await page.goto(`${FINANCE_URL}/check-vouchers/${created.id}/edit`)
    await expect(page.getByText("Void check vouchers cannot be edited.")).toBeVisible()
    await page.request.delete(`${API_URL}/api/finance/check-vouchers/${created.id}`)
  })

  test("hides editing from another admin and rejects direct updates", async ({ page }) => {
    const suffix = String(Date.now())
    const original = voucherPayload(suffix)
    const create = await page.request.post(`${API_URL}/api/finance/check-vouchers`, {
      data: original,
    })
    expect(create.ok()).toBe(true)
    const created = (await create.json()) as { id: string }

    await page.goto(`${FINANCE_URL}/check-vouchers`)
    await waitForReady(page)
    await page.getByPlaceholder("Search voucher, payee, check no.").fill(original.payee)
    await expect(page.getByRole("button", { name: "Edit voucher" })).toHaveCount(0)

    const update = await page.request.put(`${API_URL}/api/finance/check-vouchers/${created.id}`, {
      data: { ...original, payee: "Unauthorized edit" },
    })
    expect(update.status()).toBe(403)
    await page.goto(`${FINANCE_URL}/check-vouchers/${created.id}/edit`)
    await expect(page.getByText("Only Heart can edit saved check vouchers.")).toBeVisible()
    await page.request.delete(`${API_URL}/api/finance/check-vouchers/${created.id}`)
  })
})
