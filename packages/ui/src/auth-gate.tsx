import type { CreateQueryResult } from "@tanstack/solid-query"
import { type JSX, Show } from "solid-js"

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

  if (typeof window !== "undefined" && props.userQuery.isError) {
    const returnTo = encodeURIComponent(window.location.href)
    window.location.href = `${portal()}/login?return=${returnTo}`
    return null
  }

  return (
    <Show
      when={!props.userQuery.isPending}
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
