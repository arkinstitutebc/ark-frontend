import { defineConfig, devices } from "@playwright/test"

const localPortalEnv = {
  VITE_API_URL: "http://localhost:4000",
  VITE_MAIN_PORTAL_URL: "http://localhost:3000",
  VITE_TRAINING_PORTAL_URL: "http://localhost:3001",
  VITE_PROCUREMENT_PORTAL_URL: "http://localhost:3002",
  VITE_INVENTORY_PORTAL_URL: "http://localhost:3003",
  VITE_FINANCE_PORTAL_URL: "http://localhost:3004",
  VITE_BILLING_PORTAL_URL: `http://localhost:${process.env.E2E_BILLING_PORT || 3005}`,
  VITE_HR_PORTAL_URL: "http://localhost:3006",
}

const portalPorts = {
  main: 3000,
  training: 3001,
  procurement: 3002,
  inventory: 3003,
  finance: 3004,
  billing: Number(process.env.E2E_BILLING_PORT || 3005),
  hr: 3006,
} as const

const portalNames = Object.keys(portalPorts) as (keyof typeof portalPorts)[]
const selectedPortals = process.env.E2E_PORTALS
  ? process.env.E2E_PORTALS.split(",").map(name => name.trim())
  : portalNames
const unknownPortals = selectedPortals.filter(
  name => !portalNames.includes(name as keyof typeof portalPorts)
)
if (unknownPortals.length > 0) {
  throw new Error(`Unknown E2E_PORTALS: ${unknownPortals.join(", ")}`)
}

/**
 * Playwright config for Ark frontend dark-mode visual regression.
 *
 * COMMAND-ONLY: this is intentionally NOT wired into CI. Run locally with:
 *   bun run test:e2e            # run snapshots
 *   bun run test:e2e:update     # update snapshots after intentional UI changes
 *   bun run test:e2e:ui         # Playwright UI mode
 *
 * Pre-req: backend must be reachable. Frontend is started by `webServer` below.
 *
 * Two browser projects so we test BOTH OS color-scheme matrixes — `chromium-light`
 * and `chromium-dark`. Together with empty-localStorage tests, this exercises the
 * actual cold-start state that the previous test config silently skipped.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-light",
      use: { ...devices["Desktop Chrome"], colorScheme: "light" },
    },
    {
      name: "chromium-dark",
      use: { ...devices["Desktop Chrome"], colorScheme: "dark" },
    },
  ],
  /**
   * Build + serve selected portals. Defaults to all; E2E_PORTALS=main,training
   * keeps focused module tests from rebuilding unrelated apps.
   *
   * Tests run against the production build (vike preview), not dev, so the
   * Tailwind class-generation + SSR hydration path matches prod.
   */
  webServer: selectedPortals.map(name => {
    const port = portalPorts[name as keyof typeof portalPorts]
    return {
      command: `cd apps/${name} && bun run build && PORT=${port} bun run preview --port ${port}`,
      env: localPortalEnv,
      url: `http://localhost:${port}`,
      // Never treat an unrelated app already on this port as a successful portal preview.
      reuseExistingServer: false,
      timeout: 180_000,
    }
  }),
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },
})
