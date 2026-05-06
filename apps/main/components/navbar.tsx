import { RolePill, ThemeToggle } from "@ark/ui"
import { createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { UI } from "./ui"

interface Notification {
  id: string
  title: string
  description: string
  time: string
  unread: boolean
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "New procurement request",
    description: "Office supplies request from Admin Dept",
    time: "2 min ago",
    unread: true,
  },
  {
    id: "2",
    title: "Batch 2025-01 ready for billing",
    description: "80% completion threshold reached",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: "3",
    title: "Payment received",
    description: "TESDA payment for Batch 2024-12",
    time: "3 hours ago",
    unread: true,
  },
  {
    id: "4",
    title: "Student enrollment completed",
    description: "25 students added to Batch 2025-02",
    time: "Yesterday",
    unread: false,
  },
]

interface NavbarProps {
  userName?: string
  userRole?: string
  userEmail?: string
}

export function Navbar(props: NavbarProps) {
  const [adminDropdownOpen, setAdminDropdownOpen] = createSignal(false)
  const [notifDropdownOpen, setNotifDropdownOpen] = createSignal(false)
  // SSR-safe: starts as plain /profile; onMount appends ?return=current-url so
  // the profile page can route back after edits without forcing a window.* read
  // during render (hydration mismatch trap).
  const [profileHref, setProfileHref] = createSignal("/profile")
  let notifDropdownRef: HTMLDivElement | undefined
  let adminDropdownRef: HTMLDivElement | undefined

  const unreadCount = () => mockNotifications.filter(n => n.unread).length

  onMount(() => {
    // Capture the URL the user was on when they opened the menu so we can
    // return them after profile edits.
    const here = window.location.pathname + window.location.search
    if (here !== "/profile" && !here.startsWith("/profile?")) {
      setProfileHref(`/profile?return=${encodeURIComponent(here)}`)
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (notifDropdownRef && !notifDropdownRef.contains(e.target as Node)) {
        setNotifDropdownOpen(false)
      }
      if (adminDropdownRef && !adminDropdownRef.contains(e.target as Node)) {
        setAdminDropdownOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (notifDropdownOpen()) setNotifDropdownOpen(false)
      if (adminDropdownOpen()) setAdminDropdownOpen(false)
    }
    document.addEventListener("click", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    onCleanup(() => {
      document.removeEventListener("click", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    })
  })

  return (
    <header class="bg-surface sticky top-0 z-10">
      <div class="px-6 sm:px-8 lg:px-12">
        <div class="flex items-center justify-between h-20 relative">
          {/* Left: Logo style text */}
          <div class="flex items-center">
            <span class="text-xl font-bold tracking-wide text-foreground">
              <span class="uppercase">ARK</span> <span class="font-medium normal-case">Portal</span>
            </span>
          </div>

          {/* Center: Logo */}
          <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-surface px-4">
            <img
              src="/logo/ark-transpa.png"
              alt="Ark Institute Logo"
              width="50"
              height="50"
              class="object-contain"
            />
          </div>

          {/* Right: Theme toggle + Notifications + Admin dropdown */}
          <div class="flex items-center gap-3">
            <ThemeToggle compact />
            {/* Notification bell */}
            <div class="relative" ref={notifDropdownRef}>
              <button
                type="button"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen())}
                aria-label="Notifications"
                aria-haspopup="menu"
                aria-expanded={notifDropdownOpen()}
                class="relative w-10 h-10 rounded-lg hover:bg-surface-muted flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <UI.bell class="w-5 h-5 text-muted" />
                {unreadCount() > 0 && (
                  <span class="absolute top-1.5 right-1.5 w-5 h-5 bg-accent text-white text-xs font-semibold rounded-full flex items-center justify-center">
                    {unreadCount()}
                  </span>
                )}
              </button>

              <Show when={notifDropdownOpen()}>
                <div class="absolute right-0 top-full mt-2 w-80 bg-surface rounded-xl shadow-lg border border-border py-2 z-50">
                  <div class="px-4 py-3 border-b border-border flex items-center justify-between">
                    <p class="text-sm font-semibold text-foreground">Notifications</p>
                    <button type="button" class="text-xs text-primary hover:underline">
                      Mark all read
                    </button>
                  </div>
                  <div class="max-h-64 overflow-y-auto">
                    <For each={mockNotifications}>
                      {notif => (
                        <button
                          type="button"
                          class="flex gap-3 px-4 py-3 hover:bg-surface-muted border-l-2 border-transparent hover:border-primary transition-colors w-full text-left"
                        >
                          {notif.unread && (
                            <div class="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                          )}
                          {!notif.unread && <div class="w-2 h-2 mt-2 flex-shrink-0" />}
                          <div class="flex-1 min-w-0">
                            <p class="text-sm text-foreground">{notif.title}</p>
                            <p class="text-xs text-muted truncate">{notif.description}</p>
                            <p class="text-xs text-muted mt-1">{notif.time}</p>
                          </div>
                        </button>
                      )}
                    </For>
                  </div>
                  <div class="px-4 py-2 border-t border-border">
                    <button
                      type="button"
                      class="text-sm text-primary hover:underline block text-center w-full"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              </Show>
            </div>

            {/* Admin dropdown */}
            <div class="relative" ref={adminDropdownRef}>
              <button
                type="button"
                onClick={() => setAdminDropdownOpen(!adminDropdownOpen())}
                title={props.userName ? props.userName : "Account"}
                aria-label={props.userName ? `Account menu for ${props.userName}` : "Account menu"}
                aria-haspopup="menu"
                aria-expanded={adminDropdownOpen()}
                class="flex items-center gap-2 p-1 rounded-lg hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div class="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                  <UI.user class="w-5 h-5 text-white" />
                </div>
                <UI.chevronDown class="w-4 h-4 text-muted" />
              </button>

              {/* Dropdown menu */}
              <Show when={adminDropdownOpen()}>
                <div class="absolute right-0 top-full mt-2 w-56 bg-surface rounded-xl shadow-lg border border-border py-2 z-50">
                  <div class="px-4 py-3 border-b border-border">
                    <p class="text-sm font-semibold text-foreground">{props.userName || "—"}</p>
                    <p class="text-xs text-muted mt-0.5 truncate">{props.userEmail || "—"}</p>
                    <div class="mt-2">
                      <RolePill role={props.userRole || "—"} showAdminLabel />
                    </div>
                  </div>
                  <a
                    href={profileHref()}
                    class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-surface-muted"
                  >
                    <UI.user class="w-4 h-4 text-muted" />
                    <span>Manage profile</span>
                  </a>
                  <div class="h-px bg-border my-1" />
                  <a
                    href="/login"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-accent hover:bg-accent/5"
                  >
                    <UI.logout class="w-4 h-4" />
                    <span>Logout</span>
                  </a>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom border */}
      <div class="h-px bg-border" />
    </header>
  )
}
