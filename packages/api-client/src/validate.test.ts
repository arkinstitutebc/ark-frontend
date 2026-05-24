import { describe, expect, test } from "bun:test"
import { z } from "zod"
import { validateForm } from "./validate"

describe("validateForm()", () => {
  test("returns parsed data on success", () => {
    const schema = z.object({
      email: z.string().trim().email(),
      amount: z.coerce.number().positive(),
    })

    const result = validateForm(schema, {
      email: " qa@ark.test ",
      amount: "1250.50",
    })

    expect(result).toEqual({
      success: true,
      data: { email: "qa@ark.test", amount: 1250.5 },
    })
  })

  test("returns one displayable error per invalid top-level field", () => {
    const schema = z.object({
      email: z.string().email("Enter a valid email"),
      amount: z.number().positive("Amount must be positive"),
      reference: z.string().min(3, "Reference is too short"),
    })

    const result = validateForm(schema, {
      email: "not-an-email",
      amount: -1,
      reference: "",
    })

    expect(result).toEqual({
      success: false,
      errors: {
        email: "Enter a valid email",
        amount: "Amount must be positive",
        reference: "Reference is too short",
      },
    })
  })

  test("keeps the first error for a field when multiple rules fail", () => {
    const schema = z.object({
      password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must include uppercase"),
    })

    const result = validateForm(schema, { password: "abc" })

    expect(result).toEqual({
      success: false,
      errors: {
        password: "Password must be at least 8 characters",
      },
    })
  })

  test("flattens nested errors to the owning top-level field", () => {
    const schema = z.object({
      items: z.array(z.object({ amount: z.number().positive("Line amount must be positive") })),
    })

    const result = validateForm(schema, { items: [{ amount: 0 }] })

    expect(result).toEqual({
      success: false,
      errors: {
        items: "Line amount must be positive",
      },
    })
  })
})
