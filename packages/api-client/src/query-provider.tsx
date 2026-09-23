import { QueryClientProvider } from "@tanstack/solid-query"
import type { JSX } from "solid-js"
import type { CurrentUser } from "./auth"
import { getQueryClient } from "./query-client"

export function QueryProvider(props: {
  children: JSX.Element
  /**
   * Session resolved during SSR. Seeding it here means `useCurrentUser()`
   * resolves from cache instead of making a round trip on hydration.
   *
   * Only safe because `getQueryClient()` hands out a fresh client per request
   * on the server — with a module-level singleton this would leak one user's
   * session into another's response.
   */
  session?: CurrentUser | null
}) {
  const queryClient = getQueryClient()
  if (props.session) queryClient.setQueryData(["auth", "me"], props.session)
  return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
}
