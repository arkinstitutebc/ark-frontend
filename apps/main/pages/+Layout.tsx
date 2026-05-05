import { QueryProvider } from "@ark/api-client"
import "@ark/design-system/globals.css"
import type { JSX } from "solid-js"

export function Layout(props: { children: JSX.Element }) {
  return <QueryProvider>{props.children}</QueryProvider>
}
