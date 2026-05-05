import type { Page } from "@playwright/test"

export type Theme = "light" | "dark"

/** Set the theme via localStorage BEFORE navigation, so the no-FOUC script picks it up. */
export async function setTheme(page: Page, theme: Theme): Promise<void> {
  await page.addInitScript((t: string) => {
    try {
      window.localStorage.setItem("ark-theme", t)
    } catch {}
  }, theme)
}

/** Wait for fonts to load so snapshots are stable. */
export async function waitForReady(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle")
  await page.evaluate(() => document.fonts?.ready ?? Promise.resolve())
}
