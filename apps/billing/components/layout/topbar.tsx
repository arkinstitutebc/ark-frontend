import { performLogout, useCurrentUser } from "@ark/api-client"
import { TopBar as SharedTopBar } from "@ark/ui"

const MAIN_PORTAL_URL = import.meta.env.VITE_MAIN_PORTAL_URL || "https://portal.arkinstitutebc.com"

export function TopBar() {
  const userQuery = useCurrentUser()
  return (
    <SharedTopBar
      user={userQuery.data}
      onLogout={() => performLogout()}
      profileHref={`${MAIN_PORTAL_URL}/profile`}
    />
  )
}
