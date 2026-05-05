import { expect, test } from "@playwright/test"
import { effectiveBg, isDarkColor, setStoredTheme, waitForReady } from "./helpers"

/**
 * Real cold-start tests that exercise the actual production path:
 * empty localStorage + variable OS color scheme. These would have caught the
 * shipped bug where outer page rendered light gradient but card rendered dark.
 *
 * `effectiveBg` walks up to the first ancestor with non-transparent bg, so
 * intermediate `background: transparent` divs don't mask the real surface.
 *
 * The card is identified by the `border` class (matches the login card's
 * `border border-border` distinct from page-level wrappers).
 */

test.describe("cold-start (empty localStorage)", () => {
  test("light OS → light theme, body+card both light", async ({ page }) => {
    await page.goto("/login")
    await waitForReady(page)

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light")
    expect(isDarkColor(await effectiveBg(page, "body"))).toBe(false)
    expect(isDarkColor(await effectiveBg(page, "form"))).toBe(false)
  })

  test("dark OS → still light theme (default is light, dark is opt-in)", async ({ page }) => {
    await page.goto("/login")
    await waitForReady(page)

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light")
    expect(isDarkColor(await effectiveBg(page, "body"))).toBe(false)
    expect(isDarkColor(await effectiveBg(page, "form"))).toBe(false)
  })
})

test.describe("opt-in dark mode", () => {
  test("user picked dark → body+card both dark", async ({ page }) => {
    await setStoredTheme(page, "dark")
    await page.goto("/login")
    await waitForReady(page)

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
    expect(isDarkColor(await effectiveBg(page, "body"))).toBe(true)
    expect(isDarkColor(await effectiveBg(page, "form"))).toBe(true)
  })

  test("user picked auto → body & card luminance match (no mixed surfaces)", async ({ page }) => {
    await setStoredTheme(page, "auto")
    await page.goto("/login")
    await waitForReady(page)

    const body = await effectiveBg(page, "body")
    const card = await effectiveBg(page, "form")
    expect(isDarkColor(body)).toBe(isDarkColor(card))
  })

  test("preference persists across reload", async ({ page }) => {
    await setStoredTheme(page, "dark")
    await page.goto("/login")
    await waitForReady(page)
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")

    await page.reload()
    await waitForReady(page)
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
  })
})

test.describe("login page snapshot", () => {
  test("light cold-start matches baseline", async ({ page }) => {
    await page.goto("/login")
    await waitForReady(page)
    await expect(page).toHaveScreenshot("login-cold-light.png", { fullPage: true })
  })

  test("dark opt-in matches baseline", async ({ page }) => {
    await setStoredTheme(page, "dark")
    await page.goto("/login")
    await waitForReady(page)
    await expect(page).toHaveScreenshot("login-opt-dark.png", { fullPage: true })
  })
})
