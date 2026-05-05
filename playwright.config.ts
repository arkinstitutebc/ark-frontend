import { defineConfig, devices } from "@playwright/test"

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
  webServer: {
    command: "bun run dev:main",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },
})
