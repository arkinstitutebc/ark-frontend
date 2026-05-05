import type { Page } from "@playwright/test"

export type Theme = "light" | "dark"

/**
 * Pre-set the theme in localStorage BEFORE navigation.
 *
 * Use only for tests that explicitly want to simulate a returning user with a
 * stored preference. For first-visit / cold-start tests, do NOT call this —
 * leave localStorage empty so we exercise the actual production default path.
 */
export async function setStoredTheme(page: Page, theme: Theme | "auto"): Promise<void> {
  await page.addInitScript((t: string) => {
    try {
      window.localStorage.setItem("ark-theme", t)
    } catch {}
  }, theme)
}

/** Wait for fonts + network idle so screenshots are stable. */
export async function waitForReady(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle")
  await page.evaluate(() => document.fonts?.ready ?? Promise.resolve())
}

/**
 * Read the EFFECTIVE background-color of an element by walking up to the first
 * ancestor with a non-transparent background. Returns rgb string.
 *
 * This matters because most app divs have `background: transparent` and the
 * actual paint comes from a parent (body uses `var(--color-background)`).
 */
export async function effectiveBg(page: Page, selector: string): Promise<string> {
  return page.evaluate(sel => {
    let el: Element | null = document.querySelector(sel)
    if (!el) throw new Error(`Element not found: ${sel}`)
    while (el) {
      const c = window.getComputedStyle(el).backgroundColor
      // rgba with alpha 0 → transparent, walk up
      const m = c.match(/rgba?\(([^)]+)\)/)
      if (m) {
        const parts = (m[1] ?? "").split(",").map(s => Number(s.trim()))
        const alpha = parts.length === 4 ? (parts[3] ?? 1) : 1
        if (alpha > 0) return c
      }
      el = el.parentElement
    }
    return "rgb(0, 0, 0)" // shouldn't reach here — body always has bg
  }, selector)
}

/**
 * Approximate "is this color dark" check based on luminance.
 * rgb(255,255,255) → false. rgb(15,23,42) → true. Ignores transparent (alpha 0 → false).
 */
export function isDarkColor(rgb: string): boolean {
  const m = rgb.match(/rgba?\(([^)]+)\)/)
  if (!m) return false
  const parts = (m[1] ?? "").split(",").map(s => Number(s.trim()))
  const [r = 0, g = 0, b = 0] = parts
  const alpha = parts.length === 4 ? (parts[3] ?? 1) : 1
  if (alpha === 0) return false // transparent isn't "dark"
  // Relative luminance (Rec. 709). Threshold 128 splits typical light/dark surfaces cleanly.
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128
}
