import { QueryProvider } from "@ark/api-client"
import { AppToaster, ThemeProvider } from "@ark/ui"
import "@ark/design-system/globals.css"
import type { JSX } from "solid-js"

export function Layout(props: { children: JSX.Element }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AppToaster />
        {props.children}
      </QueryProvider>
    </ThemeProvider>
  )
}
