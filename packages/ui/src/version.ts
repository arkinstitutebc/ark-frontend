/**
 * App version from `ark-frontend/package.json`. Each app's vite.config.ts
 * injects this at build time via:
 *
 * ```ts
 * import pkg from "../../package.json" with { type: "json" }
 * // …
 * define: { __APP_VERSION__: JSON.stringify(pkg.version) }
 * ```
 *
 * Falls back to "dev" when run outside Vite (e.g. test harness).
 */
declare const __APP_VERSION__: string | undefined

export const ARK_VERSION: string = typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "dev"
