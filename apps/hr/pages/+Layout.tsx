import { QueryProvider, useCurrentUser } from "@ark/api-client"
import { AppToaster, AuthGate, ThemeProvider } from "@ark/ui"
import "@ark/design-system/globals.css"
import type { JSX } from "solid-js"
import { Sidebar, SidebarProvider, TopBar } from "@/components/layout"

function GatedShell(props: { children: JSX.Element }) {
  const userQuery = useCurrentUser()
  return (
    <AuthGate userQuery={userQuery}>
      <SidebarProvider>
        <div class="flex h-screen overflow-hidden">
          <Sidebar />
          <div class="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            <main class="flex-1 overflow-y-auto bg-background">{props.children}</main>
          </div>
        </div>
      </SidebarProvider>
    </AuthGate>
  )
}

export function Layout(props: { children: JSX.Element }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AppToaster />
        <GatedShell>{props.children}</GatedShell>
      </QueryProvider>
    </ThemeProvider>
  )
}
