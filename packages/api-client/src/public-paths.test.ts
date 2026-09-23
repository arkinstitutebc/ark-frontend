import { describe, expect, test } from "bun:test"
import { isPublicPath } from "./public-paths"

// The main portal's public surface: the login page and the two anonymous
// student-enrolment routes that back forms.arkinstitutebc.com.
const PUBLIC = ["/login", "/forms", "/student", "/_error"]

describe("isPublicPath()", () => {
  test("matches a prefix exactly", () => {
    expect(isPublicPath("/login", PUBLIC)).toBe(true)
  })

  test("matches a nested path under a prefix", () => {
    expect(isPublicPath("/forms/student/abc-123", PUBLIC)).toBe(true)
    expect(isPublicPath("/student/abc-123", PUBLIC)).toBe(true)
  })

  test("treats the root as private", () => {
    expect(isPublicPath("/", PUBLIC)).toBe(false)
  })

  test("treats admin and profile as private", () => {
    expect(isPublicPath("/admin/users", PUBLIC)).toBe(false)
    expect(isPublicPath("/profile", PUBLIC)).toBe(false)
    expect(isPublicPath("/learn/finance", PUBLIC)).toBe(false)
  })

  // The bug this guards against: a prefix must end at a segment boundary, or
  // "/loginsomething" would be served to anonymous visitors.
  test("requires a segment boundary, not a bare string prefix", () => {
    expect(isPublicPath("/loginsomething", PUBLIC)).toBe(false)
    expect(isPublicPath("/students", PUBLIC)).toBe(false)
    expect(isPublicPath("/formsy", PUBLIC)).toBe(false)
  })

  test("handles a trailing slash on the prefix itself", () => {
    expect(isPublicPath("/login/", PUBLIC)).toBe(true)
  })

  test("is false when no prefixes are configured", () => {
    expect(isPublicPath("/login", [])).toBe(false)
  })
})
