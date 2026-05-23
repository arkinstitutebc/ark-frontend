import { expect, test } from "@playwright/test"
import { waitForReady } from "./helpers"

/**
 * Visual regression for the new finance pages (Phase 3b).
 *
 * Two color-scheme projects (chromium-light / chromium-dark) defined in
 * playwright.config.ts run this twice, generating per-theme baselines.
 *
 * After intentional UI changes:  bun run test:e2e:update
 */

const FINANCE_URL = "http://localhost:3004"

const PAGES = [
  { path: "/income-statement?from=2026-01-01&to=2026-03-31", name: "income-statement" },
  { path: "/gl-accounts", name: "gl-accounts" },
  { path: "/assets", name: "assets" },
  { path: "/disbursements/create", name: "disbursement-create" },
] as const

for (const page of PAGES) {
  test(`visual snapshot — ${page.name}`, async ({ page: pw }) => {
    await pw.goto(`${FINANCE_URL}${page.path}`)
    await waitForReady(pw)
    // Settle async data (income statement does 3 queries; assets does 1).
    await pw.waitForLoadState("networkidle")
    await expect(pw).toHaveScreenshot(`${page.name}.png`, {
      fullPage: true,
      animations: "disabled",
    })
  })
}
