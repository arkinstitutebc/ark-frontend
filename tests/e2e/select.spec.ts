import { expect, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "./auth-helper"
import { waitForReady } from "./helpers"

/**
 * Keyboard navigation on the custom <Select> from @ark/ui.
 * Exercises the ARIA combobox 1.2 pattern: aria-expanded, aria-activedescendant,
 * data-highlighted attribute used for visual highlight.
 *
 * Needs backend: /admin/users requires admin auth; without it we get redirected
 * to /login and the modal never opens.
 */

test.describe("<Select> keyboard nav", () => {
  test("ArrowDown advances highlight, Enter commits selection", async ({ page }, testInfo) => {
    await requireBackend(testInfo)
    await loginAsAdmin(page)
    await page.goto("/admin/users")
    await waitForReady(page)

    // Open the Create user modal.
    await page
      .getByRole("button", { name: /create user/i })
      .first()
      .click()

    // The role select trigger is a combobox button.
    const trigger = page.getByRole("combobox", { name: /role/i })
    await expect(trigger).toBeVisible()

    // Initially "Trainer" is the default. Open the listbox via ArrowDown.
    await trigger.focus()
    await expect(trigger).toHaveAttribute("aria-expanded", "false")
    await page.keyboard.press("ArrowDown")
    await expect(trigger).toHaveAttribute("aria-expanded", "true")

    // Highlight is on Trainer (the selected). ArrowDown → Director.
    await page.keyboard.press("ArrowDown")
    const directorOption = page.getByRole("option", { name: "Director" })
    await expect(directorOption).toHaveAttribute("data-highlighted", "true")

    // Enter commits.
    await page.keyboard.press("Enter")
    await expect(trigger).toHaveAttribute("aria-expanded", "false")
    await expect(trigger).toContainText("Director")

    // Escape from a closed state should be a no-op (regression check).
    await trigger.focus()
    await page.keyboard.press("Escape")
    await expect(trigger).toHaveAttribute("aria-expanded", "false")
  })

  test("Escape closes listbox and returns focus to trigger", async ({ page }, testInfo) => {
    await requireBackend(testInfo)
    await loginAsAdmin(page)
    await page.goto("/admin/users")
    await waitForReady(page)

    await page
      .getByRole("button", { name: /create user/i })
      .first()
      .click()
    const trigger = page.getByRole("combobox", { name: /role/i })

    await trigger.focus()
    await page.keyboard.press("Enter") // open
    await expect(trigger).toHaveAttribute("aria-expanded", "true")

    await page.keyboard.press("Escape")
    await expect(trigger).toHaveAttribute("aria-expanded", "false")
    // Trigger should regain focus (the close() helper in select.tsx calls .focus()).
    await expect(trigger).toBeFocused()
  })
})
