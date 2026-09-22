import type { CurrentUser } from "./auth"

// Portals and the API share a VPS, so SSR resolves the session over loopback
// (~4ms) instead of making the browser pay a ~60ms round trip to /api/auth/me.
const INTERNAL_API_URL = "http://localhost:4000"

export type SsrAuthResult =
  | { status: "authenticated"; user: CurrentUser }
  | { status: "unauthenticated" }
  /** API unreachable or erroring — the client-side gate decides instead of logging everyone out. */
  | { status: "unknown" }

export async function resolveUserFromCookie(
  cookie: string | undefined,
  apiUrl: string = INTERNAL_API_URL
): Promise<SsrAuthResult> {
  if (!cookie) return { status: "unauthenticated" }

  let res: Response
  try {
    res = await fetch(`${apiUrl}/api/auth/me`, { headers: { cookie } })
  } catch {
    return { status: "unknown" }
  }

  // Only an explicit rejection means logged out. Anything else is inconclusive.
  if (res.status === 401 || res.status === 403) return { status: "unauthenticated" }
  if (!res.ok) return { status: "unknown" }

  try {
    return { status: "authenticated", user: (await res.json()) as CurrentUser }
  } catch {
    return { status: "unknown" }
  }
}
