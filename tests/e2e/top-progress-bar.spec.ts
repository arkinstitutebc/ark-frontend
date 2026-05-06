import { expect, test } from "@playwright/test"
import { waitForReady } from "./helpers"

/**
 * The TopProgressBar is rendered by `apps/main/pages/+Layout.tsx` (via @ark/ui).
 * It listens for same-origin `<a href>` clicks (capture phase) and shows a 2px
 * primary-colored bar at the top until Vike's pageContext.urlPathname changes.
 *
 * This spec is DOM-only — it doesn't need the backend up. We synthesize a
 * navigation by clicking a same-origin link (the /login page has links).
 */

test.describe("TopProgressBar", () => {
  test("shows briefly on same-origin link click, hides after navigation", async ({ page }) => {
    await page.goto("/login")
    await waitForReady(page)

    // The bar is rendered inside <Show when={visible()}>, so it doesn't exist
    // in the DOM until a navigation kicks in.
    const barSelector = ".fixed.top-0.left-0.right-0.h-0\\.5"
    expect(await page.locator(barSelector).count()).toBe(0)

    // Programmatically click a same-origin link to simulate user nav.
    // Login page footer / nav typically has an anchor; if not present, inject
    // one to test the listener path.
    await page.evaluate(() => {
      const a = document.createElement("a")
      a.href = "/profile"
      a.textContent = "go"
      a.id = "qa-test-link"
      document.body.appendChild(a)
    })

    // Click and wait for the bar to appear (the click handler runs in capture
    // phase before the browser navigates).
    await Promise.all([
      page.waitForFunction(sel => document.querySelectorAll(sel).length > 0, barSelector),
      page.locator("#qa-test-link").click(),
    ])

    // After navigation completes, the bar fades out (max ~1s).
    await page.waitForFunction(sel => document.querySelectorAll(sel).length === 0, barSelector, {
      timeout: 5_000,
    })
  })
})
