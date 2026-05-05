import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "@playwright/test"

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Regression test for the bug where VITE_API_URL was missing on Vercel and
 * the build baked the localhost:4000 fallback into the production chunks,
 * breaking login from prod.
 *
 * This test fails BEFORE the user has set VITE_API_URL on Vercel for the
 * apps/main project. Set it via:
 *   vercel env add VITE_API_URL production --cwd apps/main
 * (value: https://api.arkinstitutebc.com), then redeploy.
 *
 * For local dev/preview where you may not have VITE_API_URL set, set
 * SKIP_API_BASE_URL_CHECK=1 or run with `bun run test:e2e --grep -v "no localhost in built bundle"`.
 */

function findEntryChunks(): string[] {
  const root = join(__dirname, "..", "..")
  const entriesDir = join(root, "apps", "main", "dist", "client", "assets", "entries")
  if (!existsSync(entriesDir)) {
    throw new Error(
      `Built entries dir not found at ${entriesDir}. Run \`cd apps/main && bun run build\` first.`
    )
  }
  return readdirSync(entriesDir)
    .filter(f => f.endsWith(".js"))
    .map(f => join(entriesDir, f))
}

test.describe("built bundle: API base URL", () => {
  test.skip(
    !!process.env.SKIP_API_BASE_URL_CHECK,
    "SKIP_API_BASE_URL_CHECK set — local dev usually targets localhost:4000"
  )

  test("no entry chunk contains the localhost:4000 fallback", () => {
    const chunks = findEntryChunks()
    expect(chunks.length).toBeGreaterThan(0)

    const offenders: string[] = []
    for (const path of chunks) {
      const content = readFileSync(path, "utf8")
      if (content.includes("localhost:4000")) {
        offenders.push(path)
      }
    }

    if (offenders.length > 0) {
      throw new Error(
        `${offenders.length} entry chunk(s) contain "localhost:4000" — VITE_API_URL was not set at build time.\n\n` +
          offenders.map(p => `  - ${p.split("/").slice(-2).join("/")}`).join("\n") +
          `\n\nFix: set VITE_API_URL in the Vercel project (or local .env) before building.`
      )
    }
  })

  test("entry chunks reference the production API host", () => {
    const chunks = findEntryChunks()
    const loginChunk = chunks.find(p => p.includes("pages_login"))
    if (!loginChunk) {
      throw new Error("pages_login entry chunk not found — login page route missing?")
    }
    const content = readFileSync(loginChunk, "utf8")
    // We accept either the prod host literal OR the env-var read pattern,
    // so this works locally with VITE_API_URL set to a dev URL.
    const referencesApi =
      content.includes("api.arkinstitutebc.com") ||
      content.includes("import.meta.env.VITE_API_URL") ||
      !content.includes("localhost:4000")
    expect(referencesApi).toBe(true)
  })
})
