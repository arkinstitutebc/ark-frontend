import type { CurrentUser, UserRole } from "@ark/api-client"
import type { CreateQueryResult } from "@tanstack/solid-query"
import { createEffect, type JSX, Show } from "solid-js"
import { PageLoading } from "../feedback/page-loading"
import { Icons } from "../icons"
import { resolveAuthGateState } from "./auth-gate-state"

const DEFAULT_PORTAL_URL =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_MAIN_PORTAL_URL
    ? import.meta.env.VITE_MAIN_PORTAL_URL
    : "https://portal.arkinstitutebc.com"

export interface AuthGateProps {
  /** A useQuery result for /api/auth/me. AuthGate handles loading/error states. */
  userQuery: CreateQueryResult<CurrentUser, Error>
  children: JSX.Element
  /** URL of main portal for redirect on 401. Defaults to env var. */
  mainPortalUrl?: string
  allowedRoles?: readonly UserRole[]
  /** Session resolved during SSR. When set, renders without waiting on userQuery. */
  ssrUser?: CurrentUser | null
}

export function AuthGate(props: AuthGateProps) {
  const portal = () => props.mainPortalUrl ?? DEFAULT_PORTAL_URL

  const state = () =>
    resolveAuthGateState({
      ssrUser: props.ssrUser,
      isPending: props.userQuery.isPending,
      isError: props.userQuery.isError,
      data: props.userQuery.data,
      allowedRoles: props.allowedRoles,
    })

  // Reactive redirect: fires not only on initial 401 but also when the session
  // expires mid-use (refetch flips isError true). A bare top-of-body `if` would
  // only run once at mount and miss late expirations.
  createEffect(() => {
    if (typeof window === "undefined") return
    if (state() !== "redirect") return
    const returnTo = encodeURIComponent(window.location.href)
    window.location.href = `${portal()}/login?return=${returnTo}`
  })

  return (
    <Show
      when={state() !== "loading" && state() !== "redirect"}
      fallback={
        <div class="flex h-screen items-center justify-center">
          <PageLoading />
        </div>
      }
    >
      <Show when={state() === "allowed"} fallback={<NoPortalAccess mainPortalUrl={portal()} />}>
        {props.children}
      </Show>
    </Show>
  )
}

function NoPortalAccess(props: { mainPortalUrl: string }) {
  return (
    <div class="flex min-h-screen items-center justify-center bg-background px-6">
      <div class="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icons.lock class="h-6 w-6" />
        </div>
        <h1 class="mt-5 text-xl font-semibold text-foreground">No access to this portal</h1>
        <p class="mt-2 text-sm text-muted">
          Your account does not have permission to open this workspace.
        </p>
        <a
          href={props.mainPortalUrl}
          class="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Back to Portal
        </a>
      </div>
    </div>
  )
}
