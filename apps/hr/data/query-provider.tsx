import { QueryClientProvider } from "@tanstack/solid-query"
import type { JSX } from "solid-js"
import { queryClient } from "./query-client"

export function QueryProvider(props: { children: JSX.Element }) {
  return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
}
