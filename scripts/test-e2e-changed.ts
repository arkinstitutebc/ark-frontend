import { resolve } from "node:path"

const modules = ["training", "procurement", "inventory", "finance", "billing", "hr"] as const
type Module = (typeof modules)[number]

const allPortals = ["main", ...modules]
const allSpecs = ["tests/e2e"]

export function selectE2E(files: string[]) {
  const relevant = files.filter(file => !file.endsWith(".md"))
  if (relevant.length === 0) return { portals: [] as string[], specs: [] as string[] }

  const changedModules = new Set<Module>()
  for (const file of relevant) {
    const module = modules.find(
      name => file.startsWith(`apps/${name}/`) || file.startsWith(`tests/e2e/${name}/`)
    )
    if (module) {
      changedModules.add(module)
      continue
    }

    // Main, shared packages, setup, dependencies, and unknown code can affect every portal.
    return { portals: allPortals, specs: allSpecs }
  }

  return {
    portals: ["main", ...modules.filter(module => changedModules.has(module))],
    specs: modules
      .filter(module => changedModules.has(module))
      .map(module => `tests/e2e/${module}`),
  }
}

function gitLines(args: string[]) {
  const result = Bun.spawnSync(["git", ...args], { cwd: resolve(import.meta.dir, "..") })
  if (result.exitCode !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr.toString().trim()}`)
  }
  return result.stdout.toString().trim().split("\n").filter(Boolean)
}

function changedFiles() {
  const base = process.env.E2E_BASE
  const committed = base ? gitLines(["diff", "--name-only", `${base}...HEAD`]) : []
  const worktree = gitLines(["diff", "--name-only", "HEAD"])
  const untracked = gitLines(["ls-files", "--others", "--exclude-standard"])
  const files = [...new Set([...committed, ...worktree, ...untracked])]
  return files.length > 0 || base ? files : gitLines(["diff", "--name-only", "HEAD^", "HEAD"])
}

if (import.meta.main) {
  const files = changedFiles()
  const selection = selectE2E(files)
  console.log(`Changed files: ${files.length}`)
  if (selection.specs.length === 0) {
    console.log("No browser tests needed for docs-only changes.")
    process.exit(0)
  }

  console.log(`Browser specs: ${selection.specs.join(", ")}`)
  console.log(`Portal previews: ${selection.portals.join(", ")}`)
  const args = process.argv.slice(2)
  if (args.includes("--dry-run")) process.exit(0)

  const child = Bun.spawn(["bunx", "playwright", "test", ...selection.specs, ...args], {
    cwd: resolve(import.meta.dir, ".."),
    env: { ...process.env, E2E_PORTALS: selection.portals.join(",") },
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  })
  process.exit(await child.exited)
}
