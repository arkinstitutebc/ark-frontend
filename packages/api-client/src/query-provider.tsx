import { QueryClientProvider } from "@tanstack/solid-query"
import type { JSX } from "solid-js"
import { getQueryClient } from "./query-client"

export function QueryProvider(props: { children: JSX.Element }) {
  const queryClient = getQueryClient()
  return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
}
