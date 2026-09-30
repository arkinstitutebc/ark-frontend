import { describe, expect, test } from "bun:test"
import {
  displayTrainingScheme,
  HISTORICAL_SCHEME_LABEL,
} from "../../apps/training/data/scheme-label"

describe("training scheme display", () => {
  test("explains the historical placeholder", () => {
    expect(displayTrainingScheme("Legacy / Unspecified")).toBe(HISTORICAL_SCHEME_LABEL)
    expect(displayTrainingScheme(null)).toBe("Scheme not recorded")
  })

  test("keeps named schemes", () => {
    expect(displayTrainingScheme("STANDARD IBT")).toBe("STANDARD IBT")
  })
})
