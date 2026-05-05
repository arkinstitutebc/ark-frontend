import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  LogOut,
  Users,
} from "lucide-solid"
import { createMemo, For, Show } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"
import { useSidebar } from "./sidebar-context"

interface NavItem {
  id: string
  label: string
  href: string
  icon: typeof Users
}

const navItems: NavItem[] = [
  { id: "trainers", label: "Trainers", href: "/", icon: Users },
  { id: "attendance", label: "Attendance", href: "/attendance", icon: Clock },
  { id: "payroll", label: "Payroll", href: "/payroll", icon: CreditCard },
]

const portalUrl =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_MAIN_PORTAL_URL
    ? import.meta.env.VITE_MAIN_PORTAL_URL
    : "https://portal.arkinstitutebc.com"

export function Sidebar() {
  const pageContext = usePageContext()
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebar()
  const currentPath = createMemo(() => pageContext.urlPathname)

  const isActive = (item: NavItem) => {
    if (item.href === "/") {
      return currentPath() === "/"
    }
    return currentPath().startsWith(item.href)
  }

  const sidebarContent = () => (
    <div class="flex flex-col h-full bg-white border-r border-gray-200">
      <div class="flex items-center gap-3 px-4 h-14 border-b border-gray-100 flex-shrink-0">
        <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Users class="w-4.5 h-4.5 text-primary" />
        </div>
        <Show when={!collapsed()}>
          <div class="overflow-hidden">
            <p class="text-sm font-semibold text-gray-900 truncate">HR & Payroll</p>
            <p class="text-[11px] text-gray-500 truncate">Trainers & Attendance</p>
          </div>
        </Show>
      </div>

      <nav class="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        <For each={navItems}>
          {item => (
            <a
              href={item.href}
              onClick={() => setMobileOpen(false)}
              class={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item)
                  ? "bg-gray-100 text-gray-900 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon
                class={`w-[18px] h-[18px] flex-shrink-0 ${isActive(item) ? "text-gray-900" : "text-gray-400 group-hover:text-gray-600"}`}
              />
              <Show when={!collapsed()}>
                <span>{item.label}</span>
              </Show>
              <Show when={collapsed()}>
                <span class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded hidden group-hover:block whitespace-nowrap z-50">
                  {item.label}
                </span>
              </Show>
            </a>
          )}
        </For>
      </nav>

      <div class="border-t border-gray-100 px-2 py-3 space-y-1 flex-shrink-0">
        <a
          href={portalUrl}
          class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft class="w-[18px] h-[18px] flex-shrink-0 text-gray-400 group-hover:text-gray-600" />
          <Show when={!collapsed()}>
            <span>Back to Portal</span>
          </Show>
          <Show when={collapsed()}>
            <span class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded hidden group-hover:block whitespace-nowrap z-50">
              Back to Portal
            </span>
          </Show>
        </a>
        <a
          href={`${portalUrl}/login`}
          class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-accent hover:bg-accent/5 transition-colors"
        >
          <LogOut class="w-[18px] h-[18px] flex-shrink-0" />
          <Show when={!collapsed()}>
            <span>Logout</span>
          </Show>
          <Show when={collapsed()}>
            <span class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded hidden group-hover:block whitespace-nowrap z-50">
              Logout
            </span>
          </Show>
        </a>
        <button
          type="button"
          onClick={toggleCollapsed}
          class="hidden md:flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
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
        class={`hidden md:block flex-shrink-0 h-screen transition-all duration-200 ${collapsed() ? "w-14" : "w-56"}`}
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
