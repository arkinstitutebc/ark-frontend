import { Icons } from "@ark/ui"
import { type Component, For, Show } from "solid-js"
import type { UserRole } from "./portal-cards"

interface ResourceItem {
  href: string
  label: string
  action: string
  badge: string
  icon: Component<{ class?: string }>
  roles?: UserRole[]
}

interface ResourceDockProps {
  userRole: UserRole
}

const resources: ResourceItem[] = [
  {
    href: "/admin/users",
    label: "User Management",
    action: "Manage users",
    badge: "Admin",
    icon: Icons.users,
    roles: ["admin"],
  },
  {
    href: "/admin/posts",
    label: "Blog Posts",
    action: "Manage posts",
    badge: "Site",
    icon: Icons.fileText,
    roles: ["admin"],
  },
  {
    href: "/learn",
    label: "Learning Hub",
    action: "Open guides",
    badge: "Guides",
    icon: Icons.helpCircle,
  },
]

export function ResourceDock(props: ResourceDockProps) {
  const visibleResources = () =>
    resources.filter(item => !item.roles || item.roles.includes(props.userRole))

  return (
    <>
      <aside
        class="fixed right-3 top-32 z-30 hidden md:block xl:absolute xl:right-0 xl:top-16 xl:translate-x-[calc(100%+1rem)]"
        aria-label="Resources"
      >
        <div class="relative flex w-56 flex-col items-end gap-2 p-1.5">
          <span
            aria-hidden="true"
            class="absolute right-0 top-0 bottom-0 w-[60px] rounded-[1.35rem] border border-border bg-surface/95"
          />
          <For each={visibleResources()}>
            {item => (
              <a
                href={item.href}
                class="group relative flex h-12 w-12 items-center justify-end gap-3 overflow-hidden rounded-2xl border border-transparent bg-surface-muted/70 px-3 text-primary transition-all duration-200 ease-out hover:w-56 hover:border-primary/25 hover:bg-primary/10 focus-visible:w-56 focus-visible:border-primary/30 focus-visible:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98]"
                aria-label={item.label}
              >
                <span class="min-w-0 flex-1 translate-x-2 text-left opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                  <span class="block truncate text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    {item.badge}
                  </span>
                  <span class="block truncate text-sm font-semibold text-foreground">
                    {item.label}
                  </span>
                </span>
                <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-white group-focus-visible:bg-primary group-focus-visible:text-white">
                  <item.icon class="h-5 w-5" />
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
