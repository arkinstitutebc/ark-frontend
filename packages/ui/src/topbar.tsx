import { Bell, ChevronDown, LogOut, Menu, User } from "lucide-solid"
import { createSignal, onCleanup, onMount } from "solid-js"
import { useSidebar } from "./sidebar-context"
import { ThemeToggle } from "./theme-toggle"

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
    document.addEventListener("click", handleClickOutside)
    onCleanup(() => document.removeEventListener("click", handleClickOutside))
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

        <div class="flex items-center gap-2">
          <ThemeToggle compact />
          <button
            type="button"
            class="relative p-2 rounded-lg text-muted hover:bg-surface-muted transition-colors"
          >
            <Bell class="w-5 h-5" />
          </button>

          <div class="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen())}
              class="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-lg hover:bg-surface-muted transition-colors"
            >
              <div class="text-left hidden sm:block">
                <p class="text-sm font-semibold text-foreground leading-tight">{displayName()}</p>
                <p class="text-xs text-muted leading-tight mt-0.5 capitalize">{displayRole()}</p>
              </div>
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm flex-shrink-0">
                <User class="w-4 h-4 text-white" />
              </div>
              <ChevronDown class="w-4 h-4 text-muted flex-shrink-0" />
            </button>

            {userDropdownOpen() && (
              <div class="absolute right-0 top-full mt-2 w-48 bg-surface rounded-xl shadow-lg border border-border py-2 z-50">
                <div class="px-4 py-3 border-b border-border">
                  <p class="text-sm font-semibold text-foreground">{displayName()}</p>
                  <p class="text-xs text-muted mt-0.5 truncate">{displayEmail()}</p>
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
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
