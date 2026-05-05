import { performLogout, useCurrentUser } from "@ark/api-client"
import { TopBar as SharedTopBar } from "@ark/ui"

export function TopBar() {
  const userQuery = useCurrentUser()
  return <SharedTopBar user={userQuery.data} onLogout={() => performLogout()} />
}
