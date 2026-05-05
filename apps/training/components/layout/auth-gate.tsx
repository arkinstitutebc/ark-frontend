import { type JSX, Show } from "solid-js"
import { useCurrentUser } from "@data/hooks"

const MAIN_PORTAL_URL =
  import.meta.env.VITE_MAIN_PORTAL_URL || "https://portal.arkinstitutebc.com"

export function AuthGate(props: { children: JSX.Element }) {
  const userQuery = useCurrentUser()

  if (typeof window !== "undefined" && userQuery.isError) {
    const returnTo = encodeURIComponent(window.location.href)
    window.location.href = `${MAIN_PORTAL_URL}/login?return=${returnTo}`
    return null
  }

  return (
    <Show
      when={!userQuery.isPending}
      fallback={
        <div class="flex h-screen items-center justify-center">
          <div class="animate-pulse text-sm text-gray-500">Loading…</div>
        </div>
      }
    >
      {props.children}
    </Show>
  )
}
