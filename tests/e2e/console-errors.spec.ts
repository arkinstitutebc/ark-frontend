import { expect, test } from "@playwright/test"
import { setStoredTheme, waitForReady } from "./helpers"

/**
 * Catches runtime crashes that don't break HTML rendering but do throw uncaught
 * errors during hydration. The pre-existing TypeError "e is not a function" in
 * the login chunk is currently allow-listed below — track it via the FOLLOW-UP
 * task and remove from the allow-list once fixed.
 *
 * If a NEW console error appears (e.g. a different chunk crash, an uncaught
 * promise rejection, a CORS error), this test fails immediately.
 */

const KNOWN_NON_FATAL_ERRORS: RegExp[] = [
  /TypeError: e is not a function/,
  /No error page defined/,
  // localhost:4000 CORS errors only occur when VITE_API_URL is unset — local
  // builds without the env var hit this. CI / preview against prod will not.
  /Cross-Origin Request Blocked.*localhost:4000/,
  /NetworkError.*localhost:4000/,
  /Failed to load resource.*localhost:4000/,
  /ERR_CONNECTION_REFUSED.*localhost:4000/,
]

function isKnown(message: string): boolean {
  return KNOWN_NON_FATAL_ERRORS.some(re => re.test(message))
}

test.describe("login page: no unexpected console errors", () => {
  for (const stored of [null, "light", "dark", "auto"] as const) {
    const label = stored ?? "cold-start"

    test(`${label}`, async ({ page }) => {
      const errors: string[] = []
      page.on("pageerror", e => errors.push(`pageerror: ${e.message}`))
      page.on("console", msg => {
        if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`)
      })

      if (stored) await setStoredTheme(page, stored)
      await page.goto("/login")
      await waitForReady(page)
      await page.waitForTimeout(500)

      const unexpected = errors.filter(e => !isKnown(e))
      expect(unexpected, `unexpected errors:\n${unexpected.join("\n")}`).toEqual([])
    })
  }
})
