import type { Page, TestInfo } from "@playwright/test"

const API_URL = process.env.VITE_API_URL || "http://localhost:4000"

export interface SeededAdmin {
  email: string
  password: string
}

export const SEEDED_ADMIN: SeededAdmin = {
  email: "matt@arkinstitutebc.com",
  password: "changeme",
}

/**
 * Skip the current test if the backend isn't reachable. Use at the top of
 * any test that does real auth or DB I/O — keeps the suite green when devs
 * run frontend-only smoke tests without `docker compose up -d`.
 */
export async function requireBackend(testInfo: TestInfo): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/api/health`, { signal: AbortSignal.timeout(2000) })
    if (!res.ok) testInfo.skip(true, `Backend at ${API_URL} returned ${res.status}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    testInfo.skip(true, `Backend at ${API_URL} unreachable: ${msg}`)
  }
}

/**
 * POST /api/auth/login then push the session cookie into the Playwright
 * context so subsequent page.goto() calls are authenticated. The frontend's
 * own /login form would also work but adds 2-3 extra seconds per test; this
 * is a direct shortcut.
 */
export async function loginAsAdmin(page: Page, creds: SeededAdmin = SEEDED_ADMIN): Promise<void> {
  const res = await page.request.post(`${API_URL}/api/auth/login`, {
    data: creds,
    failOnStatusCode: false,
  })
  if (!res.ok()) {
    throw new Error(`Login failed: ${res.status()} ${await res.text()}`)
  }
  // The Set-Cookie response is automatically applied to page.context() — no
  // manual cookie shimming needed. Just navigate.
}

/** Convenience: log in then go to a path. */
export async function loginAndGoto(page: Page, path: string): Promise<void> {
  await loginAsAdmin(page)
  await page.goto(path)
}
