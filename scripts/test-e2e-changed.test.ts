import { expect, test } from "bun:test"
import { selectE2E } from "./test-e2e-changed"

test("selects only changed ERP modules and their portal previews", () => {
  expect(
    selectE2E(["apps/training/pages/board/+Page.tsx", "apps/hr/pages/calendar/+Page.tsx"])
  ).toEqual({
    portals: ["main", "training", "hr"],
    specs: ["tests/e2e/training", "tests/e2e/hr"],
  })
})

test("selects a module when its browser spec changes", () => {
  expect(selectE2E(["tests/e2e/inventory/actions.spec.ts"])).toEqual({
    portals: ["main", "inventory"],
    specs: ["tests/e2e/inventory"],
  })
})

test("widens coverage for shared changes", () => {
  expect(selectE2E(["packages/ui/src/button.tsx"])).toEqual({
    portals: ["main", "training", "procurement", "inventory", "finance", "billing", "hr"],
    specs: ["tests/e2e"],
  })
})

test("skips browser tests for documentation-only changes", () => {
  expect(selectE2E(["README.md", "apps/training/README.md"])).toEqual({
    portals: [],
    specs: [],
  })
})
