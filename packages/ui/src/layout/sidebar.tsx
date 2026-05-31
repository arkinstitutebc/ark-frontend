import { ChevronLeft, type Folder, Home, LogOut } from "lucide-solid"
import { type Component, createMemo, For, Show } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"
import { ARK_VERSION } from "../version"
import { useSidebar } from "./sidebar-context"

export interface NavItem {
  id: string
  label: string
  href: string
  icon: typeof Folder
  section?: string
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
  const compact = () => collapsed() && !mobileOpen()
  const isActiveFn = (item: NavItem) => (props.isActive ?? defaultIsActive)(item, currentPath())
  const navSections = createMemo(() => {
    const groups: Array<{ label: string | null; items: NavItem[] }> = []
    for (const item of props.navItems) {
      const label = item.section ?? null
      const current = groups.at(-1)
      if (!current || current.label !== label) {
        groups.push({ label, items: [item] })
      } else {
        current.items.push(item)
      }
    }
    return groups
  })

  const sidebarContent = () => (
    <div class="flex flex-col h-full bg-surface border-r border-border">
      {/* Portal branding */}
      <div class="flex items-center gap-3 px-4 h-14 border-b border-border flex-shrink-0">
        <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <props.brandIcon class="w-4.5 h-4.5 text-primary" />
        </div>
        <Show when={!compact()}>
          <div class="overflow-hidden">
            <p class="text-sm font-semibold text-foreground truncate">{props.brandTitle}</p>
            <Show when={props.brandSubtitle}>
              <p class="text-[11px] text-muted truncate">{props.brandSubtitle}</p>
            </Show>
          </div>
        </Show>
      </div>

      {/* Portal switch */}
      <div class="border-b border-border px-2 py-2 flex-shrink-0">
        <a
          href={portalUrl()}
          class="group relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-muted hover:bg-surface-muted hover:text-foreground transition-colors"
        >
          <Home class="w-[18px] h-[18px] flex-shrink-0 text-muted group-hover:text-foreground" />
          <Show when={!compact()}>
            <span>Back to Portal</span>
          </Show>
          <Show when={compact()}>
            <SidebarTooltip
              label="Back to Portal"
              eyebrow="Workspace"
              description="Return to the main app launcher"
            />
          </Show>
        </a>
      </div>

      {/* Navigation */}
      <nav class="flex-1 px-2 py-3 overflow-y-auto">
        <For each={navSections()}>
          {section => (
            <div class="mb-3 last:mb-0">
              <Show when={section.label && !compact()}>
                <p class="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted/70">
                  {section.label}
                </p>
              </Show>
              <div class="space-y-1">
                <For each={section.items}>
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
                      <Show when={!compact()}>
                        <span>{item.label}</span>
                      </Show>
                      <Show when={compact()}>
                        <SidebarTooltip label={item.label} eyebrow={item.section} />
                      </Show>
                    </a>
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </nav>

      {/* Bottom section: account actions */}
      <div class="border-t border-border px-2 py-3 flex-shrink-0">
        {props.onLogout ? (
          <button
            type="button"
            onClick={props.onLogout}
            class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-accent hover:bg-surface-muted transition-colors w-full text-left"
          >
            <LogOut class="w-[18px] h-[18px] flex-shrink-0" />
            <Show when={!compact()}>
              <span>Logout</span>
            </Show>
            <Show when={compact()}>
              <SidebarTooltip label="Logout" eyebrow="Account" />
            </Show>
          </button>
        ) : (
          <a
            href={`${portalUrl()}/login`}
            class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-accent hover:bg-surface-muted transition-colors"
          >
            <LogOut class="w-[18px] h-[18px] flex-shrink-0" />
            <Show when={!compact()}>
              <span>Logout</span>
            </Show>
            <Show when={compact()}>
              <SidebarTooltip label="Logout" eyebrow="Account" />
            </Show>
          </a>
        )}

        {/* Version chip — quietly anchored at the bottom of the sidebar */}
        <Show when={!compact()}>
          <p class="px-3 pt-2 text-[10px] text-muted/70 tracking-wider uppercase">v{ARK_VERSION}</p>
        </Show>
      </div>
    </div>
  )

  return (
    <>
      <aside
        class={`relative hidden md:block flex-shrink-0 h-screen transition-[width] duration-300 ease-in-out ${
          collapsed() ? "w-14" : "w-56"
        }`}
      >
        {sidebarContent()}

        {/* Floating collapse toggle — anchored mid-edge of the sidebar's right
            boundary. Half overlaps the content area so it reads as a divider
            handle. Animates the chevron 180° on collapse. */}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed() ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed() ? "Expand sidebar" : "Collapse sidebar"}
          class="group absolute top-1/2 -right-3 -translate-y-1/2 z-30 flex items-center justify-center w-6 h-6 rounded-full bg-surface border border-border shadow-sm text-muted hover:text-primary hover:border-primary hover:shadow-md hover:scale-110 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChevronLeft
            class={`w-3.5 h-3.5 transition-transform duration-300 ease-in-out ${
              collapsed() ? "rotate-180" : ""
            }`}
          />
        </button>
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

function SidebarTooltip(props: { label: string; eyebrow?: string; description?: string }) {
  return (
    <span class="pointer-events-none absolute left-full top-1/2 z-[60] ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-3 py-2 text-left shadow-lg group-hover:block group-focus-visible:block">
      <Show when={props.eyebrow}>
        <span class="block text-[10px] font-semibold uppercase tracking-wider text-muted/70">
          {props.eyebrow}
        </span>
      </Show>
      <span class="block text-xs font-medium text-foreground">{props.label}</span>
      <Show when={props.description}>
        <span class="mt-0.5 block text-[11px] font-normal text-muted">{props.description}</span>
      </Show>
    </span>
  )
}
