import { isPublicPath } from "@ark/api-client"
import { redirect } from "vike/abort"
import type { PageContextServer } from "vike/types"

/**
 * Everything on the main portal is private unless listed here. Defaulting to
 * private means a new page is guarded by accident rather than exposed by
 * accident; forgetting to list a genuinely public one shows up immediately as
 * an unexpected redirect.
 *
 * `/forms` and `/student` are the anonymous student-enrolment routes that back
 * forms.arkinstitutebc.com — guarding those would break public enrolment.
 */
const PUBLIC_PREFIXES = ["/login", "/forms", "/student", "/_error"]

export function guard(pageContext: PageContextServer) {
  if (isPublicPath(pageContext.urlPathname, PUBLIC_PREFIXES)) return

  // API unreachable — let the client decide rather than logging everyone out
  // on a transient blip.
  if (!pageContext.authResolved) return
  if (pageContext.user) return

  throw redirect("/login")
}
