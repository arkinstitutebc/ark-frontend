import { describe, expect, test } from "bun:test"
import { buildCrudListUrl } from "./crud-url"

describe("buildCrudListUrl()", () => {
  test("returns the base path when filters are missing", () => {
    expect(buildCrudListUrl("/api/training/students", undefined)).toBe("/api/training/students")
  })

  test("omits empty filters but keeps meaningful falsy values", () => {
    const url = buildCrudListUrl("/api/admin/users", {
      role: "",
      department: null,
      includeInactive: false,
      page: 0,
    })

    expect(url).toBe("/api/admin/users?includeInactive=false&page=0")
  })

  test("URL-encodes filter values", () => {
    const url = buildCrudListUrl("/api/procurement/requests", {
      status: "management approved",
      category: "Tools & Equipment",
    })

    expect(url).toBe(
      "/api/procurement/requests?status=management+approved&category=Tools+%26+Equipment"
    )
  })
})
