import { useCurrentUser } from "@data/hooks"
import { Bell, ChevronDown, LogOut, Menu, User } from "lucide-solid"
import { createSignal, onCleanup, onMount } from "solid-js"
import { useSidebar } from "./sidebar-context"

export function TopBar() {
  const { setMobileOpen } = useSidebar()
  const [userDropdownOpen, setUserDropdownOpen] = createSignal(false)
  const userQuery = useCurrentUser()
  let dropdownRef: HTMLDivElement | undefined

  const displayName = () => {
    const u = userQuery.data
    if (!u) return "-"
    return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email
  }
  const displayRole = () => userQuery.data?.role || "-"
  const displayEmail = () => userQuery.data?.email || "-"

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
    <header class="bg-white sticky top-0 z-20 border-b border-gray-200 flex-shrink-0">
      <div class="flex items-center justify-between h-14 px-4 sm:px-6">
        <div class="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            class="md:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Menu class="w-5 h-5" />
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Bell class="w-5 h-5" />
          </button>

          <div class="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen())}
              class="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-lg hover:bg-gray-100/80 transition-colors"
            >
              <div class="text-left hidden sm:block">
                <p class="text-sm font-semibold text-gray-900 leading-tight">{displayName()}</p>
                <p class="text-xs text-gray-500 leading-tight mt-0.5 capitalize">{displayRole()}</p>
              </div>
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm flex-shrink-0">
                <User class="w-4 h-4 text-white" />
              </div>
              <ChevronDown class="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>

            {userDropdownOpen() && (
              <div class="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <div class="px-4 py-3 border-b border-gray-100">
                  <p class="text-sm font-semibold text-gray-900">{displayName()}</p>
                  <p class="text-xs text-gray-500 mt-0.5 truncate">{displayEmail()}</p>
                </div>
                <button
                  type="button"
                  class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                >
                  <User class="w-4 h-4 text-gray-400" />
                  <span>Profile</span>
                </button>
                <div class="h-px bg-gray-100 my-1" />
                <a
                  href={
                    import.meta.env.VITE_MAIN_PORTAL_URL
                      ? `${import.meta.env.VITE_MAIN_PORTAL_URL}/login`
                      : "https://portal.arkinstitutebc.com/login"
                  }
                  class="flex items-center gap-3 px-4 py-2.5 text-sm text-accent hover:bg-accent/5"
                >
                  <LogOut class="w-4 h-4" />
                  <span>Logout</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
