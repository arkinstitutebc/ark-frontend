import { expect, test } from "@playwright/test"
import { waitForReady } from "../helpers"

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

/**
 * Where login sends you afterwards. `?return=` is attacker-controllable — a
 * sub-portal's AuthGate puts the previous URL there — so an unvalidated value
 * would let a crafted link bounce a freshly authenticated user off-site.
 *
 * Unit coverage for the decision lives in
 * `packages/api-client/src/login.test.ts`; these drive it through the real
 * form so the page wiring is covered too.
 */
async function signIn(page: import("@playwright/test").Page, search = "") {
  await page.goto(`/login${search}`)
  await waitForReady(page)
  await page.fill('input[type="email"]', "smoke@test.local")
  await page.fill('input[type="password"]', "GoodPass-1234!")
  await page.click('button[type="submit"]')
}

test("successful login lands on the dashboard", async ({ page }) => {
  await signIn(page)
  await page.waitForURL(url => url.pathname === "/", { timeout: 15_000 })
  expect(new URL(page.url()).pathname).toBe("/")
})

test("a return URL pointing at a known portal is honoured", async ({ page }) => {
  await signIn(page, `?return=${encodeURIComponent("http://localhost:3004/disbursements")}`)
  await page.waitForURL(/localhost:3004/, { timeout: 15_000 }).catch(() => {})
  expect(page.url()).toContain("localhost:3004/disbursements")
})

test("a hostile return URL is ignored", async ({ page }) => {
  await signIn(page, `?return=${encodeURIComponent("https://evil.example.com/phish")}`)
  await page.waitForURL(url => url.pathname === "/", { timeout: 15_000 })
  expect(page.url()).not.toContain("evil.example.com")
  expect(new URL(page.url()).pathname).toBe("/")
})
