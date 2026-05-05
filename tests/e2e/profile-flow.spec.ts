import { expect, test } from "@playwright/test"
import { waitForReady } from "./helpers"

/**
 * Real interactivity test for the profile page.
 * Catches the specific class of hydration crash where:
 *   1. The page renders (HTML present)
 *   2. But input/event bindings don't wire up (form looks alive but inert)
 *
 * Two checks per test:
 *   A. Eye-toggle click actually swaps `<input type="password">` to `type="text"`.
 *      If hydration aborted mid-tree, the toggle's onClick never wires up and
 *      this fails immediately.
 *   B. No `pageerror` or `TypeError` fires during page load.
 */
test("profile page hydrates: eye toggle actually swaps input type", async ({ page }) => {
  await page.goto("/profile?required=1")
  await waitForReady(page)
  await page.waitForTimeout(500)

  const passwordsBefore = await page.locator('input[type="password"]').count()
  const eyeButtons = await page.locator('button[aria-label*="password" i]').count()
  expect(passwordsBefore).toBeGreaterThan(0)
  expect(eyeButtons).toBeGreaterThan(0)

  await page.locator('button[aria-label*="password" i]').first().click()
  await page.waitForTimeout(300)

  const passwordsAfter = await page.locator('input[type="password"]').count()
  const textsAfter = await page.locator('input[type="text"]').count()
  expect(passwordsAfter, "one password input should have flipped to text").toBe(passwordsBefore - 1)
  expect(textsAfter).toBeGreaterThan(0)
})

test("profile page hydrates: no TypeError fires", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", e => errors.push(`pageerror: ${e.message}`))
  page.on("console", msg => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`)
  })

  await page.goto("/profile?required=1")
  await waitForReady(page)
  await page.waitForTimeout(500)

  const fatal = errors.filter(
    e =>
      // Allow-listed: localhost-API errors when running locally without backend.
      !/localhost:4000/.test(e) && !/Failed to load resource/.test(e)
  )
  expect(fatal, `unexpected errors:\n${fatal.join("\n")}`).toEqual([])
})
