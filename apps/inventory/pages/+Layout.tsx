import { QueryProvider, useCurrentUser } from "@ark/api-client"
import { AuthGate } from "@ark/ui"
import "@ark/design-system/globals.css"
import type { JSX } from "solid-js"
import { Toaster } from "solid-toast"
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
            <main class="flex-1 overflow-y-auto bg-gray-50">{props.children}</main>
          </div>
        </div>
      </SidebarProvider>
    </AuthGate>
  )
}

export function Layout(props: { children: JSX.Element }) {
  return (
    <QueryProvider>
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: { "font-size": "14px", "font-family": "Montserrat, sans-serif" },
        }}
      />
      <GatedShell>{props.children}</GatedShell>
    </QueryProvider>
  )
}
