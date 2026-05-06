import {
  performLogout,
  useCurrentUser,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from "@ark/api-client"
import { TopBar } from "./topbar"

const DEFAULT_PORTAL_URL =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_MAIN_PORTAL_URL
    ? import.meta.env.VITE_MAIN_PORTAL_URL
    : "https://portal.arkinstitutebc.com"

export interface PortalTopBarProps {
  /** Override the main portal URL (otherwise uses VITE_MAIN_PORTAL_URL env). */
  mainPortalUrl?: string
}

/**
 * Pre-wired TopBar for the 6 sub-portals: ties useCurrentUser + notification
 * hooks + logout into one drop-in. Use in a sub-portal layout as
 * `<PortalTopBar />`. apps/main has its own custom <Navbar> and does NOT use
 * this — its centered logo + hub-style branding are intentionally separate.
 */
export function PortalTopBar(props: PortalTopBarProps = {}) {
  const userQuery = useCurrentUser()
  const notifQuery = useNotifications()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()
  const portalUrl = () => props.mainPortalUrl ?? DEFAULT_PORTAL_URL
  return (
    <TopBar
      user={userQuery.data}
      onLogout={() => performLogout(portalUrl())}
      profileHref={`${portalUrl()}/profile`}
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
