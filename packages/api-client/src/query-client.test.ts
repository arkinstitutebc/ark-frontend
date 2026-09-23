import { describe, expect, test } from "bun:test"
import { isServer } from "solid-js/web"
import { getQueryClient, makeQueryClient } from "./query-client"

describe("makeQueryClient()", () => {
  // A module-level `new QueryClient()` is shared across every SSR request,
  // leaking one user's cached data into another's response. Each call must
  // therefore produce an isolated instance.
  test("returns a distinct instance on every call", () => {
    expect(makeQueryClient()).not.toBe(makeQueryClient())
  })

  test("applies the shared defaults", () => {
    const opts = makeQueryClient().getDefaultOptions().queries
    expect(opts?.staleTime).toBe(30_000)
    expect(opts?.retry).toBe(1)
    expect(opts?.refetchOnWindowFocus).toBe(false)
  })

  test("caches are not shared between instances", () => {
    const a = makeQueryClient()
    const b = makeQueryClient()
    a.setQueryData(["auth", "me"], { id: "user-a" })
    expect(b.getQueryData(["auth", "me"])).toBeUndefined()
  })
})

describe("getQueryClient()", () => {
  // bun resolves solid-js/web to its server build, so `isServer` is true here
  // and these assertions exercise the SSR branch — the one that matters.
  test("isServer is true in this environment", () => {
    expect(isServer).toBe(true)
  })

  // The property that prevents cross-request data leaks.
  test("hands out an isolated client per call on the server", () => {
    const a = getQueryClient()
    const b = getQueryClient()
    expect(a).not.toBe(b)

    a.setQueryData(["auth", "me"], { id: "user-a" })
    expect(b.getQueryData(["auth", "me"])).toBeUndefined()
  })
})
