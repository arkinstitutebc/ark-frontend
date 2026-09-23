/**
 * Whether `pathname` falls under one of the configured public prefixes.
 *
 * A prefix matches only at a path-segment boundary, so `/login` covers
 * `/login` and `/login/reset` but not `/loginsomething` — otherwise a guard
 * built on this would hand private pages to anonymous visitors.
 */
export function isPublicPath(pathname: string, publicPrefixes: readonly string[]): boolean {
  return publicPrefixes.some(prefix => {
    const p = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix
    return pathname === p || pathname.startsWith(`${p}/`)
  })
}
