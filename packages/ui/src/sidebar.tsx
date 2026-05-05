import { ArrowLeft, ChevronLeft, ChevronRight, type Folder, LogOut } from "lucide-solid"
import { type Component, createMemo, For, Show } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"
import { useSidebar } from "./sidebar-context"

export interface NavItem {
  id: string
  label: string
  href: string
  icon: typeof Folder
}

export interface SidebarProps {
  /** Branding icon shown at top */
  brandIcon: Component<{ class?: string }>
  /** Portal name shown in expanded sidebar */
  brandTitle: string
  /** Subtitle/tagline shown under title */
  brandSubtitle?: string
  /** Navigation items in this portal */
  navItems: NavItem[]
  /** Optional override for active-path detection (defaults to startsWith) */
  isActive?: (item: NavItem, currentPath: string) => boolean
  /** URL of the main portal (for "Back to Portal" link). Defaults to env var. */
  mainPortalUrl?: string
  /** Called when user clicks Logout. If not provided, links to {mainPortalUrl}/login */
  onLogout?: () => void
}

const DEFAULT_PORTAL_URL =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_MAIN_PORTAL_URL
    ? import.meta.env.VITE_MAIN_PORTAL_URL
    : "https://portal.arkinstitutebc.com"

const defaultIsActive = (item: NavItem, currentPath: string) => {
  if (item.href === "/") return currentPath === "/"
  return currentPath.startsWith(item.href)
}

export function Sidebar(props: SidebarProps) {
  const pageContext = usePageContext()
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebar()
  const currentPath = createMemo(() => pageContext.urlPathname)
  const portalUrl = () => props.mainPortalUrl ?? DEFAULT_PORTAL_URL
  const isActiveFn = (item: NavItem) => (props.isActive ?? defaultIsActive)(item, currentPath())

  const sidebarContent = () => (
    <div class="flex flex-col h-full bg-surface border-r border-border">
      {/* Portal branding */}
      <div class="flex items-center gap-3 px-4 h-14 border-b border-border flex-shrink-0">
        <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <props.brandIcon class="w-4.5 h-4.5 text-primary" />
        </div>
        <Show when={!collapsed()}>
          <div class="overflow-hidden">
            <p class="text-sm font-semibold text-foreground truncate">{props.brandTitle}</p>
            <Show when={props.brandSubtitle}>
              <p class="text-[11px] text-muted truncate">{props.brandSubtitle}</p>
            </Show>
          </div>
        </Show>
      </div>

      {/* Navigation */}
      <nav class="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        <For each={props.navItems}>
          {item => (
            <a
              href={item.href}
              onClick={() => setMobileOpen(false)}
              class={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActiveFn(item)
                  ? "bg-surface-muted text-foreground font-semibold"
                  : "text-muted hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              <item.icon
                class={`w-[18px] h-[18px] flex-shrink-0 ${isActiveFn(item) ? "text-foreground" : "text-muted group-hover:text-foreground"}`}
              />
              <Show when={!collapsed()}>
                <span>{item.label}</span>
              </Show>
              <Show when={collapsed()}>
                <span class="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded hidden group-hover:block whitespace-nowrap z-50">
                  {item.label}
                </span>
              </Show>
            </a>
          )}
        </For>
      </nav>

      {/* Bottom section */}
      <div class="border-t border-border px-2 py-3 space-y-1 flex-shrink-0">
        <a
          href={portalUrl()}
          class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:bg-surface-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft class="w-[18px] h-[18px] flex-shrink-0 text-muted group-hover:text-foreground" />
          <Show when={!collapsed()}>
            <span>Back to Portal</span>
          </Show>
          <Show when={collapsed()}>
            <span class="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded hidden group-hover:block whitespace-nowrap z-50">
              Back to Portal
            </span>
          </Show>
        </a>

        {props.onLogout ? (
          <button
            type="button"
            onClick={props.onLogout}
            class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-accent hover:bg-accent/5 transition-colors w-full text-left"
          >
            <LogOut class="w-[18px] h-[18px] flex-shrink-0" />
            <Show when={!collapsed()}>
              <span>Logout</span>
            </Show>
            <Show when={collapsed()}>
              <span class="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded hidden group-hover:block whitespace-nowrap z-50">
                Logout
              </span>
            </Show>
          </button>
        ) : (
          <a
            href={`${portalUrl()}/login`}
            class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-accent hover:bg-accent/5 transition-colors"
          >
            <LogOut class="w-[18px] h-[18px] flex-shrink-0" />
            <Show when={!collapsed()}>
              <span>Logout</span>
            </Show>
          </a>
        )}

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={toggleCollapsed}
          class="hidden md:flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:bg-surface-muted hover:text-foreground transition-colors"
        >
          <Show
            when={collapsed()}
            fallback={<ChevronLeft class="w-[18px] h-[18px] flex-shrink-0" />}
          >
            <ChevronRight class="w-[18px] h-[18px] flex-shrink-0" />
          </Show>
          <Show when={!collapsed()}>
            <span>Collapse</span>
          </Show>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside
        class={`hidden md:block flex-shrink-0 h-screen transition-all duration-200 ${
          collapsed() ? "w-14" : "w-56"
        }`}
      >
        {sidebarContent()}
      </aside>

      <Show when={mobileOpen()}>
        <div class="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            class="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside class="fixed inset-y-0 left-0 w-56 z-50">{sidebarContent()}</aside>
        </div>
      </Show>
    </>
  )
}
