import { ChevronDown, LogOut, Menu, User } from "lucide-solid"
import { createSignal, onCleanup, onMount, Show } from "solid-js"
import { NotificationBell, type NotificationBellProps } from "../display/notification-bell"
import { RolePill } from "../display/role-pill"
import { ThemeToggle } from "../theme/theme-toggle"
import { useSidebar } from "./sidebar-context"

export interface CurrentUser {
  id: string
  email: string
  role: string
  firstName: string
  lastName: string
}

export interface TopBarProps {
  user: CurrentUser | undefined
  onLogout?: () => void
  /** Optional href for the Profile menu item (e.g., main portal /profile). */
  profileHref?: string
  /** Wire to render the notification bell. Omit to hide the bell. */
  notifications?: NotificationBellProps
}

export function TopBar(props: TopBarProps) {
  const { setMobileOpen } = useSidebar()
  const [userDropdownOpen, setUserDropdownOpen] = createSignal(false)
  let dropdownRef: HTMLDivElement | undefined

  const displayName = () => {
    const u = props.user
    if (!u) return "-"
    return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email
  }
  const displayRole = () => props.user?.role || "-"
  const displayEmail = () => props.user?.email || "-"

  onMount(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef && !dropdownRef.contains(e.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && userDropdownOpen()) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener("click", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    onCleanup(() => {
      document.removeEventListener("click", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    })
  })

  return (
    <header class="bg-surface sticky top-0 z-20 border-b border-border flex-shrink-0">
      <div class="flex items-center justify-between h-14 px-4 sm:px-6">
        <div class="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            class="md:hidden p-2 -ml-2 rounded-lg text-muted hover:bg-surface-muted transition-colors"
          >
            <Menu class="w-5 h-5" />
          </button>
        </div>

        <div class="flex items-center gap-3">
          <ThemeToggle compact />
          {/* Bell only renders when the consumer wires the bindings. The
              spread is evaluated once at mount; the bindings inside should be
              accessor functions (signals), not raw values, so they stay
              reactive. */}
          <Show when={props.notifications}>{binding => <NotificationBell {...binding()} />}</Show>

          <div class="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen())}
              title={props.user ? displayName() : "Account"}
              aria-label={props.user ? `Account menu for ${displayName()}` : "Account menu"}
              aria-haspopup="menu"
              aria-expanded={userDropdownOpen()}
              class="flex items-center gap-2 p-1 rounded-lg hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm flex-shrink-0">
                <User class="w-4 h-4 text-white" />
              </div>
              <ChevronDown class="w-4 h-4 text-muted flex-shrink-0" />
            </button>

            <Show when={userDropdownOpen()}>
              <div class="absolute right-0 top-full mt-2 w-56 bg-surface rounded-xl shadow-lg border border-border py-2 z-50">
                <div class="px-4 py-3 border-b border-border">
                  <p class="text-sm font-semibold text-foreground">{displayName()}</p>
                  <p class="text-xs text-muted mt-0.5 truncate">{displayEmail()}</p>
                  <div class="mt-2">
                    <RolePill role={displayRole()} showAdminLabel />
                  </div>
                </div>
                {props.profileHref ? (
                  <a
                    href={props.profileHref}
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-surface-muted"
                  >
                    <User class="w-4 h-4 text-muted" />
                    <span>Profile</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-surface-muted w-full text-left"
                  >
                    <User class="w-4 h-4 text-muted" />
                    <span>Profile</span>
                  </button>
                )}
                <div class="h-px bg-border my-1" />
                <button
                  type="button"
                  onClick={props.onLogout}
                  class="flex items-center gap-3 px-4 py-2.5 text-sm text-accent hover:bg-accent/5 w-full text-left"
                >
                  <LogOut class="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </header>
  )
}
