import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "@playwright/test"

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Regression test: every Tailwind utility used inside `packages/ui/src/*.tsx`
 * must appear in the production CSS bundle for apps/main.
 *
 * This catches the bug where `@source` directives in
 * packages/design-system/src/globals.css pointed to non-existent paths, so
 * Tailwind never scanned packages/ui — leaving the prod CSS missing all the
 * absolute-positioning, focus, and brand-color utilities the shared UI components
 * depend on. Icons rendered above inputs, the Sign In button had no fill, etc.
 *
 * If this test fails, check:
 *   - `packages/design-system/src/globals.css` `@source` paths actually resolve
 *   - `packages/ui/src` is reachable from the @source globs
 *   - The CSS file we're reading was actually rebuilt (delete `apps/main/dist`)
 */

const REQUIRED_UTILITIES = [
  // Layout / positioning — used in Input, Modal, Sidebar, TopBar
  "absolute",
  "inset-y-0",
  "inset-0",
  "left-0",
  "right-0",
  "fixed",
  "sticky",

  // Spacing variants only present in @ark/ui
  "pl-3",
  "pl-10",
  "pr-3",
  "pr-12",

  // Pointer + flex
  "pointer-events-none",
  "flex",
  "items-center",

  // Brand colors used by Button (primary variant)
  "bg-primary",
  "text-white",

  // Custom utility from globals.css
  "shadow-glow-primary",

  // Theme tokens
  "bg-surface",
  "bg-surface-muted",
  "text-foreground",
  "text-muted",
  "border-border",
] as const

function findBuiltCss(): string {
  const root = join(__dirname, "..", "..")
  const assetsDir = join(root, "apps", "main", "dist", "client", "assets", "static")
  if (!existsSync(assetsDir)) {
    throw new Error(
      `Built CSS dir not found at ${assetsDir}. Run \`cd apps/main && bun run build\` first.`
    )
  }
  const cssFiles = readdirSync(assetsDir).filter(f => f.endsWith(".css"))
  if (cssFiles.length === 0) {
    throw new Error(`No .css files in ${assetsDir}. Build artifact is empty?`)
  }
  // Use the largest CSS file (the main bundle, not a per-page chunk)
  const largest = cssFiles
    .map(f => ({ f, size: readFileSync(join(assetsDir, f)).length }))
    .sort((a, b) => b.size - a.size)[0]
  if (!largest) throw new Error("Unreachable: cssFiles non-empty but no largest")
  return readFileSync(join(assetsDir, largest.f), "utf8")
}

test.describe("CSS bundle contents", () => {
  test("all required utility classes are generated in the prod CSS", () => {
    const css = findBuiltCss()
    const missing: string[] = []
    for (const cls of REQUIRED_UTILITIES) {
      // Match `.classname{` or `.classname ` or `.classname,` etc — Tailwind emits
      // selectors like `.absolute{position:absolute}` so we test for the rule.
      const escaped = cls.replace(/[-/]/g, "\\$&")
      const pattern = new RegExp(`\\.${escaped}(?![\\w-])`)
      if (!pattern.test(css)) missing.push(cls)
    }
    expect(missing, `Missing utility classes in built CSS: ${missing.join(", ")}`).toEqual([])
  })
})
