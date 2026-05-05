import { expect, test } from "@playwright/test"
import { waitForReady } from "./helpers"

/**
 * Real interactivity test: type into the form, submit, assert the request
 * body contains the typed values.
 *
 * This catches a class of hydration bug where the page LOOKS interactive,
 * the click DOES fire a network request, but the input → signal binding
 * is broken so the request body is empty `{"email":"","password":""}`.
 *
 * The login form was shipped broken twice without this test.
 */
test("login form binds inputs to the request body (not empty)", async ({ page }) => {
  await page.goto("/login")
  await waitForReady(page)

  await page.fill('input[type="email"]', "smoke@test.local")
  await page.fill('input[type="password"]', "PlaceholderPass-1234!")

  const [request] = await Promise.all([
    page.waitForRequest(r => r.url().includes("/api/auth/login")),
    page.click('button[type="submit"]'),
  ])

  const raw = request.postData()
  expect(raw, "POST body must not be empty").toBeTruthy()
  const body = JSON.parse(raw ?? "{}")
  expect(body.email).toBe("smoke@test.local")
  expect(body.password).toBe("PlaceholderPass-1234!")
})
