import { afterEach, describe, expect, mock, test } from "bun:test"
import { loginRedirectTarget, performLogin } from "./auth"

const originalFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = originalFetch
  mock.restore()
})

const user = {
  id: "u1",
  email: "a@b.com",
  role: "admin" as const,
  firstName: "A",
  lastName: "B",
}

const PORTALS = [
  "https://portal.arkinstitutebc.com",
  "https://finance.arkinstitutebc.com",
  "https://hr.arkinstitutebc.com",
]

describe("performLogin()", () => {
  test("posts credentials and returns the user", async () => {
    const fetchMock = mock(async () => Response.json(user, { status: 200 }))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    expect(await performLogin({ email: "a@b.com", password: "pw" })).toEqual(user)

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain("/api/auth/login")
    expect(init.method).toBe("POST")
    // Must send the session cookie, like every other call in this client.
    expect(init.credentials).toBe("include")
    expect(JSON.parse(init.body as string)).toEqual({ email: "a@b.com", password: "pw" })
  })

  test("surfaces the API error message on failure", async () => {
    globalThis.fetch = mock(async () =>
      Response.json({ error: "Invalid credentials" }, { status: 401 })
    ) as unknown as typeof fetch

    expect(performLogin({ email: "a@b.com", password: "bad" })).rejects.toThrow(
      "Invalid credentials"
    )
  })
})

describe("loginRedirectTarget()", () => {
  test("sends a user who must change their password to the profile page", () => {
    const target = loginRedirectTarget(
      { mustChangePassword: true },
      "?return=https://finance.arkinstitutebc.com/x",
      PORTALS
    )
    expect(target).toBe("/profile?required=1")
  })

  test("honours a return URL pointing at a known portal", () => {
    const target = loginRedirectTarget(
      {},
      `?return=${encodeURIComponent("https://finance.arkinstitutebc.com/disbursements")}`,
      PORTALS
    )
    expect(target).toBe("https://finance.arkinstitutebc.com/disbursements")
  })

  test("falls back to the dashboard when there is no return URL", () => {
    expect(loginRedirectTarget({}, "", PORTALS)).toBe("/")
  })

  test("allows a relative return path", () => {
    expect(loginRedirectTarget({}, `?return=${encodeURIComponent("/profile")}`, PORTALS)).toBe(
      "/profile"
    )
  })

  // An unvalidated ?return= lets anyone bounce a freshly authenticated user to
  // a site they control.
  describe("rejects open-redirect attempts", () => {
    const hostile = [
      "https://evil.com",
      "https://evil.com/phish",
      "//evil.com",
      "https://arkinstitutebc.com.evil.com",
      "https://evil-arkinstitutebc.com",
      "javascript:alert(1)",
      "http://finance.arkinstitutebc.com/x", // downgrade to plaintext
    ]
    for (const bad of hostile) {
      test(bad, () => {
        expect(loginRedirectTarget({}, `?return=${encodeURIComponent(bad)}`, PORTALS)).toBe("/")
      })
    }
  })
})
