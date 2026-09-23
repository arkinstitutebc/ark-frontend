import { QueryProvider } from "@ark/api-client"
import { AppToaster, CrossPortalLoadingOverlay, ThemeProvider, TopProgressBar } from "@ark/ui"
import "@ark/design-system/globals.css"
import "@fontsource-variable/montserrat"
import type { JSX } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"

export function Layout(props: { children: JSX.Element }) {
  const pageContext = usePageContext()
  return (
    <ThemeProvider>
      <QueryProvider session={pageContext.user}>
        <TopProgressBar />
        <CrossPortalLoadingOverlay />
        <AppToaster />
        {props.children}
      </QueryProvider>
    </ThemeProvider>
  )
}
