import { expect, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "./auth-helper"
import { waitForReady } from "./helpers"
import { API_URL } from "./test-config"

test.describe("Admin users — validation", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await requireBackend(testInfo)
    await loginAsAdmin(page)
  })

  test("create user blocks whitespace-only names before submit", async ({ page }) => {
    await page.goto("/admin/users")
    await waitForReady(page)

    await page.getByRole("button", { name: /create user/i }).click()
    const dialog = page.getByRole("dialog")
    await dialog.getByLabel(/^first name$/i).fill("   ")
    await dialog.getByLabel(/^last name$/i).fill("Validation")
    await dialog.getByLabel(/^email$/i).fill(`qa+admin-${Date.now()}@arkinstitutebc.com`)
    await dialog.getByRole("button", { name: /^create user$/i }).click()

    await expect(dialog.getByText(/first name required/i)).toBeVisible()
  })

  test("user detail blocks blank profile names before API mutation", async ({ page }) => {
    const me = await page.request.get(`${API_URL}/api/auth/me`)
    expect(me.status()).toBe(200)
    const currentUser = await me.json()

    await page.goto(`/admin/users/${currentUser.id}`)
    await waitForReady(page)

    await page.getByLabel(/^first name$/i).fill("   ")
    await page.getByRole("button", { name: /save changes/i }).click()

    await expect(page.getByText(/first name required/i)).toBeVisible()
  })
})
