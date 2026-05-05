import { createSignal, For, onCleanup, onMount } from "solid-js"
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
  let notifDropdownRef: HTMLDivElement | undefined
  let adminDropdownRef: HTMLDivElement | undefined

  const unreadCount = () => mockNotifications.filter(n => n.unread).length

  onMount(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifDropdownRef && !notifDropdownRef.contains(e.target as Node)) {
        setNotifDropdownOpen(false)
      }
      if (adminDropdownRef && !adminDropdownRef.contains(e.target as Node)) {
        setAdminDropdownOpen(false)
      }
    }
    document.addEventListener("click", handleClickOutside)
    onCleanup(() => document.removeEventListener("click", handleClickOutside))
  })

  return (
    <header class="bg-white sticky top-0 z-10">
      <div class="px-6 sm:px-8 lg:px-12">
        <div class="flex items-center justify-between h-20 relative">
          {/* Left: Logo style text */}
          <div class="flex items-center">
            <span class="text-xl font-bold tracking-wide text-gray-900">
              <span class="uppercase">ARK</span> <span class="font-medium normal-case">Portal</span>
            </span>
          </div>

          {/* Center: Logo */}
          <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white px-4">
            <img
              src="/logo/ark-transpa.png"
              alt="Ark Institute Logo"
              width="50"
              height="50"
              class="object-contain"
            />
          </div>

          {/* Right: Notifications + Admin dropdown */}
          <div class="flex items-center gap-2">
            {/* Notification bell */}
            <div class="relative" ref={notifDropdownRef}>
              <button
                type="button"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen())}
                class="relative w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <UI.bell class="w-5 h-5 text-gray-600" />
                {unreadCount() > 0 && (
                  <span class="absolute top-1.5 right-1.5 w-5 h-5 bg-accent text-white text-xs font-semibold rounded-full flex items-center justify-center">
                    {unreadCount()}
                  </span>
                )}
              </button>

              {notifDropdownOpen() && (
                <div class="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p class="text-sm font-semibold text-gray-900">Notifications</p>
                    <button type="button" class="text-xs text-primary hover:underline">
                      Mark all read
                    </button>
                  </div>
                  <div class="max-h-64 overflow-y-auto">
                    <For each={mockNotifications}>
                      {notif => (
                        <button
                          type="button"
                          class="flex gap-3 px-4 py-3 hover:bg-gray-50 border-l-2 border-transparent hover:border-primary transition-colors w-full text-left"
                        >
                          {notif.unread && (
                            <div class="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                          )}
                          {!notif.unread && <div class="w-2 h-2 mt-2 flex-shrink-0" />}
                          <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-900">{notif.title}</p>
                            <p class="text-xs text-gray-500 truncate">{notif.description}</p>
                            <p class="text-xs text-gray-400 mt-1">{notif.time}</p>
                          </div>
                        </button>
                      )}
                    </For>
                  </div>
                  <div class="px-4 py-2 border-t border-gray-100">
                    <button
                      type="button"
                      class="text-sm text-primary hover:underline block text-center w-full"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Admin dropdown */}
            <div class="relative" ref={adminDropdownRef}>
              <button
                type="button"
                onClick={() => setAdminDropdownOpen(!adminDropdownOpen())}
                class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100/80 transition-colors"
              >
                <div class="text-left hidden sm:block">
                  <p class="text-sm font-semibold text-gray-900">{props.userName || "Camille"}</p>
                  <p class="text-xs text-gray-500">{props.userRole || "Administrator"}</p>
                </div>
                <div class="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                  <UI.user class="w-5 h-5 text-white" />
                </div>
                <UI.chevronDown class="w-4 h-4 text-gray-400" />
              </button>

              {/* Dropdown menu */}
              {adminDropdownOpen() && (
                <div class="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div class="px-4 py-3 border-b border-gray-100">
                    <p class="text-sm font-semibold text-gray-900">
                      {props.userName || "Camille"} {props.userRole || "Administrator"}
                    </p>
                    <p class="text-xs text-gray-500">
                      {props.userEmail || "camille@arkinstitutebc.com"}
                    </p>
                  </div>
                  <button
                    type="button"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                  >
                    <UI.user class="w-4 h-4 text-gray-400" />
                    <span>Profile</span>
                  </button>
                  <div class="h-px bg-gray-100 my-1" />
                  <a
                    href="/login"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-accent hover:bg-accent/50"
                  >
                    <UI.logout class="w-4 h-4" />
                    <span>Logout</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom border */}
      <div class="h-px bg-gray-200" />
    </header>
  )
}
