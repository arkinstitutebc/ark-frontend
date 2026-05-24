import { afterEach, describe, expect, mock, test } from "bun:test"
import { API_URL } from "./api"
import { performLogout } from "./auth"

const originalFetch = globalThis.fetch
const originalWindow = globalThis.window

function installWindowStub() {
  const location = { href: "https://portal.arkinstitutebc.com/profile" }
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location },
  })
  return location
}

afterEach(() => {
  globalThis.fetch = originalFetch
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  })
  mock.restore()
})

describe("performLogout()", () => {
  test("posts logout and redirects to the supplied main portal login", async () => {
    const location = installWindowStub()
    const fetchMock = mock(async () => new Response(null, { status: 204 }))
    globalThis.fetch = fetchMock as typeof fetch

    await performLogout("https://portal.local")

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]).toEqual([
      `${API_URL}/api/auth/logout`,
      { method: "POST", credentials: "include" },
    ])
    expect(location.href).toBe("https://portal.local/login")
  })

  test("still redirects when logout request fails", async () => {
    const location = installWindowStub()
    globalThis.fetch = mock(async () => {
      throw new Error("network down")
    }) as typeof fetch

    await performLogout("https://portal.local")

    expect(location.href).toBe("https://portal.local/login")
  })
})
