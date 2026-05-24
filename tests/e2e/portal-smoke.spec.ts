import { expect, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "./auth-helper"
import { waitForReady } from "./helpers"
import { PORTAL_URLS } from "./test-config"

type PortalSmokeCase = {
  portal: string
  url: string
  routes: string[]
}

const portals: PortalSmokeCase[] = [
  {
    portal: "Main",
    url: PORTAL_URLS.main,
    routes: [
      "/",
      "/profile",
      "/learn",
      "/learn/training",
      "/learn/procurement",
      "/learn/inventory",
      "/learn/finance",
      "/learn/billing",
      "/learn/hr",
    ],
  },
  {
    portal: "Training",
    url: PORTAL_URLS.training,
    routes: ["/", "/students", "/tutorials"],
  },
  {
    portal: "Procurement",
    url: PORTAL_URLS.procurement,
    routes: ["/", "/approvals", "/orders", "/pr/create", "/orders/create", "/tutorials"],
  },
  {
    portal: "Inventory",
    url: PORTAL_URLS.inventory,
    routes: ["/", "/receiving", "/movements", "/count", "/tutorials"],
  },
  {
    portal: "Finance",
    url: PORTAL_URLS.finance,
    routes: [
      "/",
      "/banks",
      "/transfers",
      "/transfers/create",
      "/disbursements",
      "/disbursements/create",
      "/pnl",
      "/income-statement",
      "/gl-accounts",
      "/assets",
      "/assets/create",
      "/reimbursements",
      "/reimbursements/create",
      "/reimbursements/approvals",
      "/tutorials",
    ],
  },
  {
    portal: "Billing",
    url: PORTAL_URLS.billing,
    routes: ["/", "/receivables", "/receivables/create", "/tutorials"],
  },
  {
    portal: "HR",
    url: PORTAL_URLS.hr,
    routes: ["/", "/attendance", "/payroll", "/tutorials"],
  },
]

test.describe("ERP portal smoke", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await requireBackend(testInfo)
    await loginAsAdmin(page)
  })

  for (const { portal, url, routes } of portals) {
    for (const route of routes) {
      test(`${portal} ${route} renders without route errors`, async ({ page }) => {
        await page.goto(`${url}${route}`)
        await waitForReady(page)

        await expect(page.locator("body")).not.toContainText(
          /404|Page not found|Internal Server Error|Something went wrong/i
        )
        await expect(page.locator("body")).not.toContainText(
          /Cannot read properties|TypeError|ReferenceError/i
        )
      })
    }
  }
})
