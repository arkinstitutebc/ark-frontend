import { afterEach, describe, expect, mock, test } from "bun:test"
import { API_URL, api } from "./api"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  mock.restore()
})

describe("api()", () => {
  test("prefixes API_URL and sends JSON credentials by default", async () => {
    const fetchMock = mock(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })
    globalThis.fetch = fetchMock as typeof fetch

    const result = await api<{ ok: boolean }>("/api/ping")

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${API_URL}/api/ping`)
    expect(init?.credentials).toBe("include")
    expect(init?.headers).toEqual({ "Content-Type": "application/json" })
  })

  test("merges caller headers without dropping Content-Type", async () => {
    const fetchMock = mock(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      return new Response(JSON.stringify({ saved: true }), { status: 200 })
    })
    globalThis.fetch = fetchMock as typeof fetch

    await api<{ saved: boolean }>("/api/save", {
      method: "POST",
      headers: { "X-Trace-Id": "unit-test" },
      body: JSON.stringify({ name: "Ark" }),
    })

    const [, init] = fetchMock.mock.calls[0]
    expect(init?.method).toBe("POST")
    expect(init?.headers).toEqual({
      "Content-Type": "application/json",
      "X-Trace-Id": "unit-test",
    })
    expect(init?.body).toBe(JSON.stringify({ name: "Ark" }))
  })

  test("returns undefined for 204 No Content", async () => {
    globalThis.fetch = mock(async () => new Response(null, { status: 204 })) as typeof fetch

    await expect(api<void>("/api/delete-me")).resolves.toBeUndefined()
  })

  test("returns undefined for an empty 200 response body", async () => {
    globalThis.fetch = mock(async () => new Response("", { status: 200 })) as typeof fetch

    await expect(api<void>("/api/empty-success")).resolves.toBeUndefined()
  })

  test("throws backend error messages from JSON error bodies", async () => {
    globalThis.fetch = mock(
      async () =>
        new Response(JSON.stringify({ error: "Email already exists" }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        })
    ) as typeof fetch

    await expect(api("/api/admin/users")).rejects.toThrow("Email already exists")
  })

  test("falls back to status code when an error response is not JSON", async () => {
    globalThis.fetch = mock(
      async () => new Response("gateway timeout", { status: 504 })
    ) as typeof fetch

    await expect(api("/api/admin/users")).rejects.toThrow("API error 504")
  })

  test("surfaces invalid success JSON as a parse failure", async () => {
    globalThis.fetch = mock(async () => new Response("{not-json", { status: 200 })) as typeof fetch

    await expect(api("/api/broken-json")).rejects.toThrow()
  })
})
