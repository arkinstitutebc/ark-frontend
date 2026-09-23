import { QueryProvider } from "@ark/api-client"
import {
  AppToaster,
  CrossPortalLoadingOverlay,
  PortalTopBar,
  SubPortalShell,
  ThemeProvider,
  TopProgressBar,
} from "@ark/ui"
import "@ark/design-system/globals.css"
import "@fontsource-variable/montserrat"
import type { JSX } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"
import { Sidebar } from "@/components/layout"

export function Layout(props: { children: JSX.Element }) {
  const pageContext = usePageContext()
  return (
    <ThemeProvider>
      <QueryProvider session={pageContext.user}>
        <TopProgressBar />
        <CrossPortalLoadingOverlay />
        <AppToaster />
        <SubPortalShell
          sidebar={<Sidebar />}
          topBar={<PortalTopBar />}
          allowedRoles={["admin", "director"]}
          ssrUser={pageContext.user}
        >
          {props.children}
        </SubPortalShell>
      </QueryProvider>
    </ThemeProvider>
  )
}
