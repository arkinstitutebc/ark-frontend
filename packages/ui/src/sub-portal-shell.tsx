import { useCurrentUser } from "@ark/api-client"
import type { JSX } from "solid-js"
import { AuthGate } from "./auth-gate"
import { SidebarProvider } from "./sidebar-context"

export interface SubPortalShellProps {
  /** Branded sidebar (each portal supplies its own nav). */
  sidebar: JSX.Element
  /** Branded topbar (typically wraps `<TopBar>` with portal-specific bindings). */
  topBar: JSX.Element
  children: JSX.Element
}

/**
 * Shared shell for the 6 sub-portals (training/procurement/inventory/finance/
 * billing/hr). Internally wraps `<AuthGate>` (redirects to main portal /login
 * on 401) + `<SidebarProvider>` + the standard flex layout. Calls
 * `useCurrentUser()` itself so consumer layouts don't need to.
 *
 * Each app's existing `<TopBar>` and `<Sidebar>` from `@/components/layout`
 * are passed via slots — those wrappers add portal-specific config (sidebar
 * items, profile href, notification wiring).
 */
export function SubPortalShell(props: SubPortalShellProps) {
  const userQuery = useCurrentUser()
  return (
    <AuthGate userQuery={userQuery}>
      <SidebarProvider>
        <div class="flex h-screen overflow-hidden">
          {props.sidebar}
          <div class="flex-1 flex flex-col overflow-hidden">
            {props.topBar}
            <main class="flex-1 overflow-y-auto bg-background">{props.children}</main>
          </div>
        </div>
      </SidebarProvider>
    </AuthGate>
  )
}
