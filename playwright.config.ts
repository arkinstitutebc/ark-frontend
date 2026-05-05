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
  /**
   * Build apps/main first, then serve via `vike preview`. Tests run against
   * the production build — same code path users hit on prod, including the
   * Tailwind class-generation pipeline. Catches missing-class bugs that
   * `vike dev` (JIT) would silently mask.
   */
  webServer: {
    command: "cd apps/main && bun run build && bun run preview --port 3000",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },
})
