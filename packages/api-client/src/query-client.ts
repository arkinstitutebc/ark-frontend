import { QueryClient } from "@tanstack/solid-query"
import { isServer } from "solid-js/web"

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

/**
 * A module-level `new QueryClient()` is shared by every SSR request, so one
 * user's cached data can be served to another. On the server we therefore hand
 * out a fresh client per request; in the browser there is only ever one
 * visitor, so we reuse a single instance.
 */
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}
