import { afterEach, describe, expect, mock, test } from "bun:test"
import { resolveUserFromCookie } from "./ssr-auth"

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

describe("resolveUserFromCookie()", () => {
  test("returns unauthenticated without calling the API when no cookie is present", async () => {
    const fetchMock = mock(async () => new Response(null, { status: 200 }))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const result = await resolveUserFromCookie(undefined)

    expect(result).toEqual({ status: "unauthenticated" })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test("returns the user and forwards the cookie on 200", async () => {
    const fetchMock = mock(async () => Response.json(user, { status: 200 }))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const result = await resolveUserFromCookie("token=abc", "http://localhost:4000")

    expect(result).toEqual({ status: "authenticated", user })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("http://localhost:4000/api/auth/me")
    expect((init.headers as Record<string, string>).cookie).toBe("token=abc")
  })

  test("returns unauthenticated on 401", async () => {
    globalThis.fetch = mock(
      async () => new Response(null, { status: 401 })
    ) as unknown as typeof fetch

    expect(await resolveUserFromCookie("token=bad")).toEqual({ status: "unauthenticated" })
  })

  test("returns unauthenticated on 403", async () => {
    globalThis.fetch = mock(
      async () => new Response(null, { status: 403 })
    ) as unknown as typeof fetch

    expect(await resolveUserFromCookie("token=bad")).toEqual({ status: "unauthenticated" })
  })

  // The critical case: a transient API outage must not log every user out.
  test("returns unknown when the API is unreachable", async () => {
    globalThis.fetch = mock(async () => {
      throw new Error("ECONNREFUSED")
    }) as unknown as typeof fetch

    expect(await resolveUserFromCookie("token=abc")).toEqual({ status: "unknown" })
  })

  test("returns unknown on a 5xx from the API", async () => {
    globalThis.fetch = mock(
      async () => new Response(null, { status: 503 })
    ) as unknown as typeof fetch

    expect(await resolveUserFromCookie("token=abc")).toEqual({ status: "unknown" })
  })

  test("returns unknown when the API returns a 200 with an unparseable body", async () => {
    globalThis.fetch = mock(
      async () => new Response("not json", { status: 200 })
    ) as unknown as typeof fetch

    expect(await resolveUserFromCookie("token=abc")).toEqual({ status: "unknown" })
  })
})
