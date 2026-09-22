import { describe, expect, test } from "bun:test"
import { resolveAuthGateState } from "./auth-gate-state"

const admin = {
  id: "u1",
  email: "a@b.com",
  role: "admin" as const,
  firstName: "A",
  lastName: "B",
}
const trainer = { ...admin, id: "u2", role: "trainer" as const }

const pending = { isPending: true, isError: false, data: undefined }
const settled = { isPending: false, isError: false, data: undefined }

describe("resolveAuthGateState()", () => {
  test("renders immediately from a server-resolved user, despite a pending query", () => {
    expect(resolveAuthGateState({ ...pending, ssrUser: admin })).toBe("allowed")
  })

  test("shows loading when there is no server-resolved user and the query is pending", () => {
    expect(resolveAuthGateState(pending)).toBe("loading")
  })

  test("falls back to the client query result when ssrUser is absent", () => {
    expect(resolveAuthGateState({ ...settled, data: admin })).toBe("allowed")
  })

  test("treats a null ssrUser as absent and falls back to the query", () => {
    expect(resolveAuthGateState({ ...pending, ssrUser: null })).toBe("loading")
  })

  // A session expiring mid-use only shows up on the client query; the SSR
  // snapshot cannot know about it, so a live error must still win.
  test("redirects when the client query errors even though ssrUser was set", () => {
    expect(resolveAuthGateState({ ...settled, isError: true, ssrUser: admin })).toBe("redirect")
  })

  test("redirects when the query errors and there is no ssrUser", () => {
    expect(resolveAuthGateState({ ...settled, isError: true })).toBe("redirect")
  })

  test("redirects when the query settles with no user at all", () => {
    expect(resolveAuthGateState(settled)).toBe("redirect")
  })

  test("denies a server-resolved user whose role is not allowed", () => {
    expect(
      resolveAuthGateState({ ...pending, ssrUser: trainer, allowedRoles: ["admin", "director"] })
    ).toBe("denied")
  })

  test("allows a server-resolved user whose role is allowed", () => {
    expect(
      resolveAuthGateState({ ...pending, ssrUser: admin, allowedRoles: ["admin", "director"] })
    ).toBe("allowed")
  })

  test("denies a client-resolved user whose role is not allowed", () => {
    expect(resolveAuthGateState({ ...settled, data: trainer, allowedRoles: ["admin"] })).toBe(
      "denied"
    )
  })

  test("allows any role when allowedRoles is omitted", () => {
    expect(resolveAuthGateState({ ...pending, ssrUser: trainer })).toBe("allowed")
  })
})
