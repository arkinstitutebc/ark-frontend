import { QueryProvider } from "@ark/api-client"
import { AppToaster, SubPortalShell, ThemeProvider, TopProgressBar } from "@ark/ui"
import "@ark/design-system/globals.css"
import "@fontsource-variable/montserrat"
import type { JSX } from "solid-js"
import { Sidebar, TopBar } from "@/components/layout"

export function Layout(props: { children: JSX.Element }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <TopProgressBar />
        <AppToaster />
        <SubPortalShell sidebar={<Sidebar />} topBar={<TopBar />}>
          {props.children}
        </SubPortalShell>
      </QueryProvider>
    </ThemeProvider>
  )
}
