import { redirect } from "vike/abort"
import type { PageContextServer } from "vike/types"

const MAIN_PORTAL_URL = import.meta.env.VITE_MAIN_PORTAL_URL ?? "https://portal.arkinstitutebc.com"

export function guard(pageContext: PageContextServer) {
  // API unreachable — stay out of the way and let the client gate decide
  // rather than logging everyone out on a transient blip.
  if (!pageContext.authResolved) return
  if (pageContext.user) return

  throw redirect(`${MAIN_PORTAL_URL}/login`)
}
