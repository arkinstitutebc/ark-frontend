import { expect, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "../auth-helper"
import { waitForReady } from "../helpers"
import { API_URL, PORTAL_URLS } from "../test-config"

interface BatchFixture {
  id: string
  batchCode: string
}

async function firstBatch(
  page: import("@playwright/test").Page,
  testInfo: import("@playwright/test").TestInfo
) {
  const res = await page.request.get(`${API_URL}/api/training/batches`)
  expect(res.status()).toBe(200)
  const batches = (await res.json()) as BatchFixture[]
  testInfo.skip(batches.length === 0, "No seeded training batches available for billing E2E")
  return batches[0]
}

test.describe("Billing actions", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await requireBackend(testInfo)
    await loginAsAdmin(page)
  })

  test("marks a receivable billed, then records full payment", async ({ page }, testInfo) => {
    const batch = await firstBatch(page, testInfo)
    const amount = 1234.56
    const createRes = await page.request.post(`${API_URL}/api/billing/receivables`, {
      data: {
        batchId: batch.id,
        amount: String(amount),
        notes: `E2E billing action ${Date.now()}`,
      },
    })
    expect(createRes.status()).toBe(201)
    const receivable = (await createRes.json()) as { id: string }

    await page.goto(`${PORTAL_URLS.billing}/receivables`)
    await waitForReady(page)
    await page.getByPlaceholder(/search batch/i).fill(batch.batchCode)

    const row = page.getByRole("row").filter({ hasText: batch.batchCode }).first()
    await expect(row).toBeVisible()
    await row.getByRole("button", { name: /mark billed/i }).click()
    await expect(row.getByRole("button", { name: /record payment/i })).toBeVisible()

    await row.getByRole("button", { name: /record payment/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("heading", { name: "Record Payment" })).toBeVisible()
    await dialog.getByLabel(/payment amount/i).fill(String(amount))
    await dialog.getByRole("button", { name: /^record payment$/i }).click()

    await expect(dialog).toBeHidden()
    await expect
      .poll(async () => {
        const res = await page.request.get(`${API_URL}/api/billing/receivables/${receivable.id}`)
        const updated = (await res.json()) as { status: string }
        return updated.status
      })
      .toBe("paid")
    await expect(row.getByText("Paid", { exact: true }).first()).toBeVisible()
  })
})
