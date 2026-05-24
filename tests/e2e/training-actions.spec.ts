import { expect, type Locator, type Page, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "./auth-helper"
import { waitForReady } from "./helpers"

const TRAINING_URL = "http://localhost:3001"

async function selectOption(page: Page, scope: Locator, label: string, option: string) {
  await scope.getByRole("combobox", { name: label }).click()
  await page.getByRole("option", { name: option, exact: true }).click()
}

async function createBatch(page: Page, seed: string) {
  await page.goto(`${TRAINING_URL}/`)
  await waitForReady(page)

  await page.getByRole("button", { name: /new batch/i }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()

  await selectOption(page, dialog, "Training type", "Bartending NC II")
  await dialog.getByPlaceholder(/Sen\. Alan Cayetano|Juan Dela Cruz/i).fill(`QA Sponsor ${seed}`)
  await dialog.locator('input[type="date"]').nth(0).fill("2026-04-01")
  await dialog.locator('input[type="date"]').nth(1).fill("2026-04-15")
  await selectOption(page, dialog, "Venue", "Ark Institute Big Room")
  await selectOption(page, dialog, "Instructor", "Other (type below)")
  await dialog.getByPlaceholder(/Chef Maria Santos/i).fill(`QA Instructor ${seed}`)
  await dialog.getByRole("button", { name: /create batch/i }).click()

  await expect(dialog).toBeHidden()
  const row = page.getByRole("row").filter({ hasText: `QA Sponsor ${seed}` })
  await expect(row).toBeVisible()
  return row
}

test.describe("Training — batch and student actions", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await requireBackend(testInfo)
    await loginAsAdmin(page)
  })

  test("batch modal blocks empty required fields before submit", async ({ page }) => {
    await page.goto(`${TRAINING_URL}/`)
    await waitForReady(page)

    await page.getByRole("button", { name: /new batch/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    await dialog.getByRole("button", { name: /create batch/i }).click()

    await expect(dialog.getByText("Training type is required")).toBeVisible()
    await expect(dialog.getByText("Sponsor is required")).toBeVisible()
    await expect(dialog.getByText("Start date is required")).toBeVisible()
    await expect(dialog.getByText("Venue is required")).toBeVisible()
    await expect(dialog.getByText("Instructor is required")).toBeVisible()
  })

  test("creates a batch, adds a student, then deletes the student", async ({ page }, testInfo) => {
    const seed = `${testInfo.project.name}-${Date.now()}`
    const row = await createBatch(page, seed)

    await row.click()
    await waitForReady(page)
    await expect(page.getByRole("heading", { name: /BAT-|BATCH-|JDVP-|TWSP-/i })).toBeVisible()
    await expect(page.getByText(`QA Sponsor ${seed}`)).toBeVisible()
    await expect(page.getByText(`QA Instructor ${seed}`)).toBeVisible()

    await page.getByRole("button", { name: /add student/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    await dialog.getByPlaceholder("Juan").fill(`QAFirst${seed.slice(-6)}`)
    await dialog.getByPlaceholder("Dela Cruz").fill(`QALast${seed.slice(-6)}`)
    await dialog.getByRole("button", { name: /add student/i }).click()

    await expect(dialog).toBeHidden()
    const studentRow = page.getByRole("row").filter({ hasText: `QAFirst${seed.slice(-6)}` })
    await expect(studentRow).toBeVisible()

    await studentRow.getByTitle("Delete student").click()
    const confirm = page.getByRole("dialog")
    await expect(confirm.getByText("Delete student?")).toBeVisible()
    await expect(confirm.getByText(`QAFirst${seed.slice(-6)}`)).toBeVisible()
    await confirm.getByRole("button", { name: /^delete$/i }).click()

    await expect(confirm).toBeHidden()
    await expect(studentRow).toHaveCount(0)
  })

  test("student modal blocks blank single-student submissions", async ({ page }) => {
    await page.goto(`${TRAINING_URL}/students`)
    await waitForReady(page)

    await page.getByRole("button", { name: /add student/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    await dialog.getByRole("button", { name: /add student/i }).click()

    await expect(dialog.getByText("First name is required")).toBeVisible()
    await expect(dialog.getByText("Last name is required")).toBeVisible()
    await expect(dialog.getByText("Batch is required")).toBeVisible()
  })
})
