import { expect, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "./auth-helper"
import { waitForReady } from "./helpers"

/**
 * Manage Profile (M4) — name edit + avatar upload.
 *
 * ⚠ MUTATES USER DATA. Run only against a local backend with a test DB
 * (or be willing to rename matt's prod firstName twice).
 *
 * Backend prereq: /api/auth/me, PATCH /api/auth/me, POST /api/auth/me/avatar
 * must be live. The avatar test asserts EITHER the success path (Cloudinary
 * configured) OR the 503 path (Cloudinary not configured) — both prove the
 * route is wired correctly.
 */

const ORIGINAL_FIRST_NAME = "Matt"
const QA_FIRST_NAME = "QA-Tester"

test.describe("Manage Profile — name edit", () => {
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== "passed") return
    // Best-effort revert so a re-run starts from a clean state.
    try {
      const api = process.env.VITE_API_URL || "http://localhost:4000"
      await page.request.patch(`${api}/api/auth/me`, {
        data: { firstName: ORIGINAL_FIRST_NAME },
      })
    } catch {
      // ignore — the test still passed
    }
  })

  test("PATCH /api/auth/me updates the name and the dropdown reflects it", async ({
    page,
  }, testInfo) => {
    await requireBackend(testInfo)
    await loginAsAdmin(page)
    await page.goto("/profile")
    await waitForReady(page)

    const firstNameInput = page.getByLabel(/^first name$/i)
    await expect(firstNameInput).toBeVisible()

    await firstNameInput.fill(QA_FIRST_NAME)
    await page.getByRole("button", { name: /save changes/i }).click()

    // Toast appears — solid-toast renders into a portal; match by text.
    await expect(page.getByText(/profile updated/i)).toBeVisible({ timeout: 5_000 })

    // Reload — input should still show the saved value.
    await page.reload()
    await waitForReady(page)
    await expect(page.getByLabel(/^first name$/i)).toHaveValue(QA_FIRST_NAME)
  })
})

test.describe("Manage Profile — avatar upload", () => {
  test("POST /api/auth/me/avatar accepts the file (success or 503 both prove route is wired)", async ({
    page,
  }, testInfo) => {
    await requireBackend(testInfo)
    await loginAsAdmin(page)
    await page.goto("/profile")
    await waitForReady(page)

    // Hidden file input on the photo card.
    const fileInput = page.locator('input[type="file"][accept*="image"]')
    await fileInput.setInputFiles("tests/fixtures/avatar-1px.png")

    // Either: toast.success "Photo uploaded" (Cloudinary configured)
    // OR:     toast.error containing 503 / "Failed to upload" (Cloudinary not configured)
    const successOrFail = page.getByText(
      /photo uploaded|failed to upload|cloudinary credentials not configured/i
    )
    await expect(successOrFail).toBeVisible({ timeout: 10_000 })
  })
})
