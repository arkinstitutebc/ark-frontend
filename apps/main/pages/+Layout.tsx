import { QueryProvider } from "@ark/api-client"
import { ThemeProvider } from "@ark/ui"
import "@ark/design-system/globals.css"
import type { JSX } from "solid-js"

export function Layout(props: { children: JSX.Element }) {
  return (
    <ThemeProvider>
      <QueryProvider>{props.children}</QueryProvider>
    </ThemeProvider>
  )
}
