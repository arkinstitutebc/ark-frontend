import { ArrowLeft, type Folder, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-solid"
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
  const sidebarActionLabel = () =>
    mobileOpen() ? "Close menu" : collapsed() ? "Expand sidebar" : "Collapse sidebar"
  const handleSidebarAction = () => {
    if (mobileOpen()) {
      setMobileOpen(false)
      return
    }
    toggleCollapsed()
  }
  const isActiveFn = (item: NavItem) => (props.isActive ?? defaultIsActive)(item, currentPath())
  const navItemClass = (item: NavItem) =>
    `group relative flex items-center ${
      compact() ? "justify-center px-0" : "gap-3 px-3"
    } h-10 rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      isActiveFn(item)
        ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/10"
        : "text-muted hover:bg-primary/5 hover:text-foreground"
    }`
  const utilityActionClass = (tone: "default" | "accent" = "default") =>
    `group relative flex items-center ${
      compact() ? "justify-center px-0" : "gap-3 px-3"
    } h-10 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      tone === "accent"
        ? "text-accent hover:bg-accent/10"
        : "text-muted hover:bg-primary/5 hover:text-foreground"
    }`
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
      {/* Portal branding + collapse control */}
      <div
        class={`border-b border-border flex-shrink-0 ${
          compact()
            ? "px-2 py-3 flex flex-col items-center gap-2"
            : "h-16 px-3 flex items-center gap-3"
        }`}
      >
        <div class="group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/5 shadow-sm">
          <img
            src="/logo/ark-transpa.png"
            alt="Ark Institute"
            width="30"
            height="30"
            class="h-7 w-7 object-contain"
          />
          <span class="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-md border border-surface bg-primary text-white shadow-sm">
            <props.brandIcon class="h-2.5 w-2.5" />
          </span>
          <Show when={compact()}>
            <SidebarTooltip
              label={props.brandTitle}
              eyebrow="Ark Portal"
              description={props.brandSubtitle}
            />
          </Show>
        </div>
        <Show when={!compact()}>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-foreground truncate leading-tight">
              {props.brandTitle}
            </p>
            <Show when={props.brandSubtitle}>
              <p class="text-[11px] text-muted truncate">{props.brandSubtitle}</p>
            </Show>
          </div>
        </Show>
        <button
          type="button"
          onClick={handleSidebarAction}
          aria-label={sidebarActionLabel()}
          title={sidebarActionLabel()}
          class="group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Show when={collapsed() && !mobileOpen()} fallback={<PanelLeftClose class="h-4 w-4" />}>
            <PanelLeftOpen class="h-4 w-4" />
          </Show>
          <Show when={compact()}>
            <SidebarTooltip label={sidebarActionLabel()} eyebrow="Layout" />
          </Show>
        </button>
      </div>

      {/* Navigation */}
      <nav class="flex-1 px-2 py-3 overflow-y-auto">
        <For each={navSections()}>
          {section => (
            <div class="mb-4 last:mb-0">
              <Show when={section.label && !compact()}>
                <p class="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">
                  {section.label}
                </p>
              </Show>
              <div class="space-y-1.5">
                <For each={section.items}>
                  {item => (
                    <a
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      class={navItemClass(item)}
                    >
                      <Show when={isActiveFn(item)}>
                        <span class="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-primary" />
                      </Show>
                      <item.icon
                        class={`h-[18px] w-[18px] flex-shrink-0 ${
                          isActiveFn(item) ? "text-primary" : "text-muted group-hover:text-primary"
                        }`}
                      />
                      <Show when={!compact()}>
                        <span class="truncate">{item.label}</span>
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
        <a href={portalUrl()} class={utilityActionClass()}>
          <ArrowLeft class="h-[18px] w-[18px] flex-shrink-0 text-muted group-hover:text-primary" />
          <Show when={!compact()}>
            <span>Portal</span>
          </Show>
          <Show when={compact()}>
            <SidebarTooltip
              label="Back to Portal"
              eyebrow="Workspace"
              description="Return to the main app launcher"
            />
          </Show>
        </a>
        {props.onLogout ? (
          <button
            type="button"
            onClick={props.onLogout}
            class={`${utilityActionClass("accent")} mt-1.5 w-full text-left`}
          >
            <LogOut class="h-[18px] w-[18px] flex-shrink-0" />
            <Show when={!compact()}>
              <span>Logout</span>
            </Show>
            <Show when={compact()}>
              <SidebarTooltip label="Logout" eyebrow="Account" />
            </Show>
          </button>
        ) : (
          <a href={`${portalUrl()}/login`} class={`${utilityActionClass("accent")} mt-1.5`}>
            <LogOut class="h-[18px] w-[18px] flex-shrink-0" />
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
          collapsed() ? "w-16" : "w-60"
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
