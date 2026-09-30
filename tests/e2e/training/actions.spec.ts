import type { Batch, BatchStatus } from "@ark/data-types"
import { expect, type Locator, type Page, test } from "@playwright/test"
import { loginAsAdmin, requireBackend } from "../auth-helper"
import { waitForReady } from "../helpers"
import { PORTAL_URLS } from "../test-config"

const TRAINING_URL = PORTAL_URLS.training

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

  await selectOption(page, dialog, "Qualification", "Bartending NC II")
  await selectOption(page, dialog, "Program scheme", "STANDARD IBT")
  await dialog.getByPlaceholder(/Sen\. Alan Cayetano|Juan Dela Cruz/i).fill(`QA Sponsor ${seed}`)
  await dialog.locator('input[type="date"]').nth(0).fill("2026-04-01")
  await dialog.locator('input[type="date"]').nth(1).fill("2026-04-15")
  await selectOption(page, dialog, "Venue", "On-site")
  await selectOption(page, dialog, "Instructor", "Other (type below)")
  await dialog.getByPlaceholder(/Chef Maria Santos/i).fill(`QA Instructor ${seed}`)
  await dialog.getByRole("spinbutton", { name: /gross revenue \/ budget/i }).fill("1234.56")
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

    await expect(dialog.getByText("Qualification is required")).toBeVisible()
    await expect(dialog.getByText("Program scheme is required")).toBeVisible()
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

  test("moves a batch on the separate board", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    const batch: Batch = {
      id: "25b809e9-5396-4d6d-90d6-871395d923f2",
      batchCode: "TEST-BOARD-001",
      senator: "QA sponsor",
      trainingName: "Bartending NC II",
      trainingOfferingId: "d5101bc8-014e-47dd-a9ea-14ac3da2c6dd",
      trainingSchemeId: "dcdd3bc9-bbae-47cf-8b76-0f6d37c76ec4",
      trainingLevel: "NC II",
      trainingCategory: "Bartending",
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      venue: "On-site",
      instructor: "QA trainer",
      studentsEnrolled: 12,
      studentsCapacity: 25,
      budget: 100000,
      budgetUsed: 0,
      withholdingRate: 2,
      grossRevenue: 100000,
      withholdingAmount: 2000,
      netBudget: 98000,
      status: "Not Started",
      completionPercentage: 0,
      createdAt: "2026-09-01T00:00:00Z",
      updatedAt: "2026-09-01T00:00:00Z",
    }
    let status: BatchStatus = batch.status
    await page.route("**/api/training/batches", async route => {
      await route.fulfill({ json: [{ ...batch, status }] })
    })
    await page.route(`**/api/training/batches/${batch.id}`, async route => {
      status = (route.request().postDataJSON() as { status: BatchStatus }).status
      await route.fulfill({ json: { ...batch, status } })
    })

    await page.goto(`${TRAINING_URL}/`)
    await waitForReady(page)
    await expect(page.getByRole("row").filter({ hasText: batch.batchCode })).toBeVisible()
    await expect(page.getByRole("button", { name: "Board", exact: true })).toHaveCount(0)

    await page.goto(`${TRAINING_URL}/board`)
    await waitForReady(page)
    await expect(page.getByRole("heading", { name: "Batch Board" })).toBeVisible()

    const card = page.locator("article").filter({ hasText: batch.batchCode })
    const cardIn = (status: string) =>
      page
        .locator(`section[aria-label="${status} batches"] article`)
        .filter({ hasText: batch.batchCode })
    await expect(cardIn("Not Started")).toBeVisible()

    await card
      .getByRole("combobox", { name: `Move ${batch.batchCode} to` })
      .selectOption("In Progress")
    await expect(cardIn("In Progress")).toBeVisible()

    await card
      .getByRole("button", { name: `Drag ${batch.batchCode}` })
      .dragTo(page.locator('section[aria-label="Completed batches"]'))
    await expect(cardIn("Completed")).toBeVisible()
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
