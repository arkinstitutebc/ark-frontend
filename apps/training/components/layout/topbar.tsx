// TODO(M9+): all 6 sub-portal topbar.tsx files are byte-identical. Extract to
// a shared `<PortalTopBar />` in `@ark/ui` so we delete 5 copies of this file.
import {
  performLogout,
  useCurrentUser,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from "@ark/api-client"
import { TopBar as SharedTopBar } from "@ark/ui"

const MAIN_PORTAL_URL = import.meta.env.VITE_MAIN_PORTAL_URL || "https://portal.arkinstitutebc.com"

export function TopBar() {
  const userQuery = useCurrentUser()
  const notifQuery = useNotifications()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()
  return (
    <SharedTopBar
      user={userQuery.data}
      onLogout={() => performLogout()}
      profileHref={`${MAIN_PORTAL_URL}/profile`}
      notifications={{
        notifications: () => notifQuery.data?.notifications ?? [],
        unreadCount: () => notifQuery.data?.unreadCount ?? 0,
        isLoading: () => notifQuery.isLoading,
        onMarkRead: id => markRead.mutate(id),
        onMarkAllRead: () => markAllRead.mutate(),
      }}
    />
  )
}
