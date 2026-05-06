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
import { Sidebar } from "@/components/layout"

export function Layout(props: { children: JSX.Element }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <TopProgressBar />
        <CrossPortalLoadingOverlay />
        <AppToaster />
        <SubPortalShell sidebar={<Sidebar />} topBar={<PortalTopBar />}>
          {props.children}
        </SubPortalShell>
      </QueryProvider>
    </ThemeProvider>
  )
}
