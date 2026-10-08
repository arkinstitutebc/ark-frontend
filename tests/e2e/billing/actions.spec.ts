import { expect, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "../auth-helper"
import { waitForReady } from "../helpers"
import { API_URL, PORTAL_URLS } from "../test-config"

async function createTrainingReceivable(page: import("@playwright/test").Page) {
  const [offeringsResponse, schemesResponse] = await Promise.all([
    page.request.get(`${API_URL}/api/training/settings/offerings`),
    page.request.get(`${API_URL}/api/training/settings/schemes`),
  ])
  expect(offeringsResponse.status()).toBe(200)
  expect(schemesResponse.status()).toBe(200)
  const offerings = (await offeringsResponse.json()) as { id: string }[]
  const schemes = (await schemesResponse.json()) as { id: string }[]
  expect(offerings.length).toBeGreaterThan(0)
  expect(schemes.length).toBeGreaterThan(0)
  const created = await page.request.post(`${API_URL}/api/training/batches`, {
    data: {
      trainingOfferingId: offerings[0].id,
      trainingSchemeId: schemes[0].id,
      senator: `E2E Billing ${Date.now()}`,
      startDate: "2026-05-01",
      endDate: "2026-05-31",
      venue: "On-site",
      instructor: "E2E Trainer",
      budget: "1234.56",
    },
  })
  expect(created.status()).toBe(201)
  const batch = (await created.json()) as { id: string; batchCode: string }
  const receivables = await page.request.get(
    `${API_URL}/api/billing/receivables?search=${batch.batchCode}`
  )
  expect(receivables.status()).toBe(200)
  const response = (await receivables.json()) as {
    items: { id: string; batchCode: string; amount: string }[]
  }
  const receivable = response.items.find(item => item.batchCode === batch.batchCode)
  if (!receivable) throw new Error(`Training batch ${batch.batchCode} has no receivable`)
  return receivable
}

test.describe("Billing actions", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await requireBackend(testInfo)
    await loginAsAdmin(page)
  })

  test("records payment on a training-generated receivable", async ({ page }) => {
    const receivable = await createTrainingReceivable(page)
    const amount = Number(receivable.amount)

    await page.goto(`${PORTAL_URLS.billing}/receivables`)
    await waitForReady(page)
    await page.getByPlaceholder(/search batch/i).fill(receivable.batchCode)

    const row = page.getByRole("row").filter({ hasText: receivable.batchCode }).first()
    await expect(row).toBeVisible()
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
        const updated = (await res.json()) as { status: string; paidAt: string | null }
        return updated.status === "paid" && updated.paidAt ? updated.paidAt : null
      })
      .not.toBeNull()
    await expect(row.getByText("Paid", { exact: true }).first()).toBeVisible()
    await expect(row.locator("td").nth(5)).not.toHaveText("—")
    await expect(row.locator("td").nth(5)).not.toHaveText("Not recorded")
  })
})
