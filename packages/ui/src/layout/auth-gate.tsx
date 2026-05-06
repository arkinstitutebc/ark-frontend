import type { CreateQueryResult } from "@tanstack/solid-query"
import { createEffect, type JSX, Show } from "solid-js"

const DEFAULT_PORTAL_URL =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_MAIN_PORTAL_URL
    ? import.meta.env.VITE_MAIN_PORTAL_URL
    : "https://portal.arkinstitutebc.com"

export interface AuthGateProps {
  /** A useQuery result for /api/auth/me. AuthGate handles loading/error states. */
  userQuery: CreateQueryResult<unknown, Error>
  children: JSX.Element
  /** URL of main portal for redirect on 401. Defaults to env var. */
  mainPortalUrl?: string
}

export function AuthGate(props: AuthGateProps) {
  const portal = () => props.mainPortalUrl ?? DEFAULT_PORTAL_URL

  // Reactive redirect: fires not only on initial 401 but also when the session
  // expires mid-use (refetch flips isError true). A bare top-of-body `if` would
  // only run once at mount and miss late expirations.
  createEffect(() => {
    if (typeof window === "undefined") return
    if (!props.userQuery.isError) return
    const returnTo = encodeURIComponent(window.location.href)
    window.location.href = `${portal()}/login?return=${returnTo}`
  })

  return (
    <Show
      when={!props.userQuery.isPending && !props.userQuery.isError}
      fallback={
        <div class="flex h-screen items-center justify-center">
          <div class="animate-pulse text-sm text-muted">Loading…</div>
        </div>
      }
    >
      {props.children}
    </Show>
  )
}
