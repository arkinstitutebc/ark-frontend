import { expect, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "./auth-helper"
import { waitForReady } from "./helpers"

/**
 * Notifications (M6) — fan-out from inviteUser, badge count, mark-all-read.
 *
 * ⚠ MUTATES USER DATA. Creates a throwaway user per run and deactivates it
 * in afterEach. Run only against a local backend with a test DB.
 */

const API_URL = process.env.VITE_API_URL || "http://localhost:4000"

interface InvitedUser {
  id: string
  email: string
  tempPassword: string
}

let invited: InvitedUser | null = null

test.describe("Notifications fan-out + bell", () => {
  // biome-ignore lint/correctness/noEmptyPattern: Playwright requires the first argument to be a destructured fixture object — empty {} omits all fixtures while still satisfying the API.
  test.beforeEach(async ({}, testInfo) => {
    await requireBackend(testInfo)
    invited = null
  })

  test.afterEach(async ({ page }) => {
    if (!invited) return
    // Deactivate via admin API. Best-effort.
    try {
      await loginAsAdmin(page)
      await page.request.patch(`${API_URL}/api/admin/users/${invited.id}`, {
        data: { isActive: false },
      })
    } catch {
      // ignore
    }
    invited = null
  })

  test("inviteUser → new user sees badge=1 + 'Welcome to Ark Institute'", async ({ page }) => {
    // Step 1: log in as matt admin and invite a new user
    await loginAsAdmin(page)
    const stamp = Date.now()
    const inviteRes = await page.request.post(`${API_URL}/api/admin/users`, {
      data: {
        email: `qa+notif-${stamp}@arkinstitutebc.com`,
        firstName: "QA",
        lastName: "Notif",
        role: "trainer",
      },
    })
    expect(inviteRes.status()).toBe(201)
    const body = await inviteRes.json()
    invited = {
      id: body.user.id,
      email: body.user.email,
      tempPassword: body.tempPassword,
    }

    // Step 2: log out + log in as the new user
    await page.request.post(`${API_URL}/api/auth/logout`)
    const loginRes = await page.request.post(`${API_URL}/api/auth/login`, {
      data: { email: invited.email, password: invited.tempPassword },
    })
    expect(loginRes.status()).toBe(200)

    // mustChangePassword is true → the page redirects to /profile?required=1.
    // Navigate explicitly to /profile to land on a page with the topbar bell.
    await page.goto("/profile")
    await waitForReady(page)

    // Step 3: Bell badge shows "1"
    const bell = page.getByRole("button", { name: /notifications.*1.*unread/i })
    await expect(bell).toBeVisible({ timeout: 10_000 })

    // Step 4: Click bell → "Welcome to Ark Institute" appears
    await bell.click()
    await expect(page.getByText(/welcome to ark institute/i)).toBeVisible()
  })

  test("Mark all read clears the badge", async ({ page }) => {
    // Same setup as above
    await loginAsAdmin(page)
    const stamp = Date.now()
    const inviteRes = await page.request.post(`${API_URL}/api/admin/users`, {
      data: {
        email: `qa+mar-${stamp}@arkinstitutebc.com`,
        firstName: "QA",
        lastName: "MarkAll",
        role: "trainer",
      },
    })
    const body = await inviteRes.json()
    invited = {
      id: body.user.id,
      email: body.user.email,
      tempPassword: body.tempPassword,
    }

    await page.request.post(`${API_URL}/api/auth/logout`)
    await page.request.post(`${API_URL}/api/auth/login`, {
      data: { email: invited.email, password: invited.tempPassword },
    })

    await page.goto("/profile")
    await waitForReady(page)

    const bell = page.getByRole("button", { name: /notifications.*\d+.*unread/i })
    await bell.click()

    await page.getByRole("button", { name: /mark all read/i }).click()

    // After marking all read, the bell badge should be 0 (no longer matches /1+ unread/).
    await expect(page.getByRole("button", { name: /notifications.*0.*unread/i })).toBeVisible({
      timeout: 5_000,
    })

    // Verify via API too
    const list = await page.request.get(`${API_URL}/api/notifications`)
    const json = await list.json()
    expect(json.unreadCount).toBe(0)
  })
})
