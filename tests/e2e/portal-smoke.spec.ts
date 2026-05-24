import { expect, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "./auth-helper"
import { waitForReady } from "./helpers"

type PortalSmokeCase = {
  portal: string
  url: string
  routes: string[]
}

const portals: PortalSmokeCase[] = [
  {
    portal: "Main",
    url: "http://localhost:3000",
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
    url: "http://localhost:3001",
    routes: ["/", "/students", "/tutorials"],
  },
  {
    portal: "Procurement",
    url: "http://localhost:3002",
    routes: ["/", "/approvals", "/orders", "/pr/create", "/orders/create", "/tutorials"],
  },
  {
    portal: "Inventory",
    url: "http://localhost:3003",
    routes: ["/", "/receiving", "/movements", "/count", "/tutorials"],
  },
  {
    portal: "Finance",
    url: "http://localhost:3004",
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
    url: "http://localhost:3005",
    routes: ["/", "/receivables", "/receivables/create", "/tutorials"],
  },
  {
    portal: "HR",
    url: "http://localhost:3006",
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
