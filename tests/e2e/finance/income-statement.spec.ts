import { expect, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "../auth-helper"
import { waitForReady } from "../helpers"
import { PORTAL_URLS } from "../test-config"

/**
 * Verifies the Segmented Income Statement renders the CSV-shaped layout
 * (Revenue → Variable → Contribution → Traceable Fixed → Segment Margin →
 * Common/Admin → Net Operating Income) end-to-end against the live backend.
 *
 * Requires:
 *   - backend reachable at VITE_API_URL (DEV_BYPASS or a valid cookie)
 *   - `bun src/db/seed-demo.ts` already run so the IS isn't empty
 */

const FINANCE_URL = PORTAL_URLS.finance

test.describe("Finance — Segmented Income Statement", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await requireBackend(testInfo)
    await loginAsAdmin(page)
  })

  test("renders the full waterfall + segment columns", async ({ page }) => {
    await page.goto(`${FINANCE_URL}/income-statement?from=2026-01-01&to=2026-03-31`)
    await waitForReady(page)

    // PageHeader title
    await expect(page.getByRole("heading", { name: /Segmented Income Statement/i })).toBeVisible()

    // Three profit-center columns in the table header
    await expect(page.locator("thead").getByText("JDVP", { exact: true })).toBeVisible()
    await expect(page.locator("thead").getByText("TWSP F&B", { exact: true })).toBeVisible()
    await expect(page.locator("thead").getByText("TWSP HSK", { exact: true })).toBeVisible()
    await expect(page.locator("thead").getByText("Total", { exact: true })).toBeVisible()

    // Section headers — the CSV-defined waterfall
    await expect(page.getByText(/REVENUE \(GROSS RECEIPTS\)/i)).toBeVisible()
    await expect(page.getByText(/LESS: VARIABLE COSTS/i)).toBeVisible()
    await expect(page.getByText(/CONTRIBUTION MARGIN/i)).toBeVisible()
    await expect(page.getByText(/LESS: TRACEABLE FIXED COSTS/i)).toBeVisible()
    await expect(page.getByText(/SEGMENT MARGIN/i)).toBeVisible()
    await expect(page.getByText(/LESS: COMMON \/ ADMINISTRATIVE COSTS/i)).toBeVisible()
    await expect(page.getByRole("cell", { name: "NET OPERATING INCOME" })).toBeVisible()

    // Filter chips
    await expect(page.getByRole("button", { name: /Current quarter/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /Year to date/i })).toBeVisible()
  })

  test("PDF export link is reachable", async ({ page }) => {
    await page.goto(`${FINANCE_URL}/income-statement?from=2026-01-01&to=2026-03-31`)
    await waitForReady(page)
    const pdfLink = page.getByRole("link", { name: /View PDF/i })
    await expect(pdfLink).toBeVisible()
    const href = await pdfLink.getAttribute("href")
    expect(href).toMatch(/\/api\/finance\/income-statement\/pdf/)
  })
})
