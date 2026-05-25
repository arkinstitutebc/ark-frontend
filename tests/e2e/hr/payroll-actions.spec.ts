import { expect, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "../auth-helper"
import { waitForReady } from "../helpers"
import { API_URL, PORTAL_URLS } from "../test-config"

interface PayrollPeriod {
  id: string
  label: string
  status: string
}

interface PayrollPeriodDetail extends PayrollPeriod {
  entries: unknown[]
}

const DEMO_PAYROLL_LABEL = "[DEMO] Payroll E2E May 2026"

test.describe("HR payroll actions", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await requireBackend(testInfo)
    await loginAsAdmin(page)
  })

  test("processes the seeded demo payroll period", async ({ page }, testInfo) => {
    const res = await page.request.get(`${API_URL}/api/hr/payroll`)
    expect(res.status()).toBe(200)
    const periods = (await res.json()) as PayrollPeriod[]
    const period = periods.find(p => p.label === DEMO_PAYROLL_LABEL)
    testInfo.skip(!period, "Demo payroll period unavailable; run backend db:seed:demo first")

    await page.goto(`${PORTAL_URLS.hr}/payroll/${period.id}`)
    await waitForReady(page)

    if (period.status === "draft") {
      await page.getByRole("button", { name: /^process payroll$/i }).click()
      const dialog = page.getByRole("dialog")
      await expect(dialog.getByText("Process Payroll")).toBeVisible()
      await dialog.getByRole("button", { name: /^process payroll$/i }).click()
    }

    await expect
      .poll(async () => {
        const detailRes = await page.request.get(`${API_URL}/api/hr/payroll/${period.id}`)
        expect(detailRes.status()).toBe(200)
        const detail = (await detailRes.json()) as PayrollPeriodDetail
        return { status: detail.status, entries: detail.entries.length }
      })
      .toEqual({ status: "processed", entries: 1 })

    await expect(page.getByRole("link", { name: /download pdf/i })).toBeVisible()
  })

  test("blocks already-processed payroll repost", async ({ page }, testInfo) => {
    const res = await page.request.get(`${API_URL}/api/hr/payroll`)
    expect(res.status()).toBe(200)
    const periods = (await res.json()) as PayrollPeriod[]
    const period = periods.find(p => p.label === DEMO_PAYROLL_LABEL)
    testInfo.skip(!period, "Demo payroll period unavailable; run backend db:seed:demo first")

    await page.goto(`${PORTAL_URLS.hr}/payroll/${period.id}`)
    await waitForReady(page)

    if (period.status === "draft") {
      await page.getByRole("button", { name: /^process payroll$/i }).click()
      const dialog = page.getByRole("dialog")
      await expect(dialog.getByText("Process Payroll")).toBeVisible()
      await dialog.getByRole("button", { name: /^process payroll$/i }).click()

      await expect
        .poll(async () => {
          const detailRes = await page.request.get(`${API_URL}/api/hr/payroll/${period.id}`)
          expect(detailRes.status()).toBe(200)
          const updated = (await detailRes.json()) as PayrollPeriod
          return updated.status
        })
        .toBe("processed")
    }

    const duplicate = await page.request.post(`${API_URL}/api/hr/payroll/${period.id}/process`)
    expect(duplicate.status()).toBe(409)
    expect((await duplicate.json()).error).toBe("Payroll already contains entries for this period")
  })
})
