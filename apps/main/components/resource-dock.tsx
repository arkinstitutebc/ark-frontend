import { hasPortalAccess, type PortalKey, type UserRole } from "@ark/api-client"
import { Icons } from "@ark/ui"
import { type Component, For, Show } from "solid-js"

interface ResourceItem {
  key: PortalKey
  href: string
  label: string
  action: string
  badge: string
  icon: Component<{ class?: string }>
}

interface ResourceDockProps {
  userRole: UserRole
}

const resources: ResourceItem[] = [
  {
    key: "adminUsers",
    href: "/admin/users",
    label: "User Management",
    action: "Manage users",
    badge: "Admin",
    icon: Icons.users,
  },
  {
    key: "adminPosts",
    href: "/admin/posts",
    label: "Blog Posts",
    action: "Manage posts",
    badge: "Site",
    icon: Icons.fileText,
  },
  {
    key: "adminSettings",
    href: "/admin/settings",
    label: "Email Alerts",
    action: "Edit alerts",
    badge: "Admin",
    icon: Icons.mail,
  },
  {
    key: "learning",
    href: "/learn",
    label: "Learning Hub",
    action: "Open guides",
    badge: "Guides",
    icon: Icons.helpCircle,
  },
]

export function ResourceDock(props: ResourceDockProps) {
  const visibleResources = () => resources.filter(item => hasPortalAccess(props.userRole, item.key))

  return (
    <>
      <aside
        class="fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 md:block"
        aria-label="Resources"
      >
        <div class="flex flex-col gap-1.5 rounded-2xl border border-border bg-surface p-1.5">
          <For each={visibleResources()}>
            {item => (
              <a
                href={item.href}
                class="group relative flex h-10 w-10 items-center justify-center rounded-xl text-primary transition-all duration-200 ease-out hover:-translate-x-0.5 hover:scale-105 hover:bg-primary/10 focus-visible:-translate-x-0.5 focus-visible:scale-105 focus-visible:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95"
                aria-label={item.label}
              >
                <item.icon class="h-5 w-5 transition-transform duration-200 ease-out group-hover:scale-110 group-focus-visible:scale-110" />
                <span class="pointer-events-none absolute right-full top-1/2 mr-3 min-w-40 -translate-y-1/2 translate-x-2 scale-95 rounded-xl border border-border bg-surface px-3 py-2 text-left opacity-0 transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:scale-100 group-focus-visible:opacity-100">
                  <span class="block text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                    {item.badge}
                  </span>
                  <span class="mt-0.5 block whitespace-nowrap text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                </span>
              </a>
            )}
          </For>
        </div>
      </aside>

      <section class="mt-8 md:hidden" aria-label="Resources">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Resources</h3>
        <div class="overflow-hidden rounded-2xl border border-border bg-surface">
          <For each={visibleResources()}>
            {item => (
              <a
                href={item.href}
                class="group flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none"
              >
                <span class="flex min-w-0 items-center gap-3">
                  <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon class="h-5 w-5" />
                  </span>
                  <span class="min-w-0">
                    <span class="block truncate text-sm font-semibold text-foreground">
                      {item.label}
                    </span>
                    <span class="block truncate text-xs text-muted">{item.action}</span>
                  </span>
                </span>
                <span class="flex items-center gap-2 text-xs font-semibold text-primary">
                  <Show when={item.badge !== "Guides"}>
                    <span class="rounded-full bg-accent/10 px-2 py-1 text-accent">
                      {item.badge}
                    </span>
                  </Show>
                  <Icons.arrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </a>
            )}
          </For>
        </div>
      </section>
    </>
  )
}
