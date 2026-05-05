import { expect, test } from "@playwright/test"
import { setStoredTheme, waitForReady } from "./helpers"

/**
 * Catches runtime crashes during page load + hydration. Any console.error or
 * pageerror that doesn't match the local-only CORS allow-list will fail.
 *
 * The "TypeError: e is not a function" allow-list entry was removed after
 * RCA showed it was actually breaking input → signal binding (login form
 * was submitting empty values). Lesson: never silently allow-list a runtime
 * error without proving it's truly cosmetic.
 */

const KNOWN_NON_FATAL_ERRORS: RegExp[] = [
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
