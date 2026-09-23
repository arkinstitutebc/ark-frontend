import { type CurrentUser, resolveUserFromCookie } from "@ark/api-client"
import type { PageContextServer } from "vike/types"

// Runs per incoming request. Resolves the session over loopback (~4ms) so the
// browser never pays the ~60ms round trip to /api/auth/me before rendering.
export async function onCreatePageContext(pageContext: PageContextServer) {
  const result = await resolveUserFromCookie(pageContext.headers?.cookie)
  pageContext.user = result.status === "authenticated" ? result.user : null
  pageContext.authResolved = result.status !== "unknown"
}

declare global {
  namespace Vike {
    interface PageContext {
      user?: CurrentUser | null
      /** False when the API was unreachable — the client gate decides instead. */
      authResolved?: boolean
    }
  }
}
