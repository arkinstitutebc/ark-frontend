import { QueryProvider } from "@ark/api-client"
import { AppToaster, CrossPortalLoadingOverlay, ThemeProvider, TopProgressBar } from "@ark/ui"
import "@ark/design-system/globals.css"
import "@fontsource-variable/montserrat"
import type { JSX } from "solid-js"

export function Layout(props: { children: JSX.Element }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <TopProgressBar />
        <CrossPortalLoadingOverlay />
        <AppToaster />
        {props.children}
      </QueryProvider>
    </ThemeProvider>
  )
}
