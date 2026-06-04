import { hasPortalAccess, type PortalKey, useCurrentUser } from "@ark/api-client"
import { BackLink, Icons, PageLoading, type TutorialSection, TutorialShell } from "@ark/ui"
import { createEffect, type JSX, Show } from "solid-js"
import { Footer, Navbar } from "@/components"

export interface LearnPageProps {
  portalKey: PortalKey
  title: string
  subtitle?: string
  intro?: JSX.Element
  workflow?: string[]
  checklist?: string[]
  sections: TutorialSection[]
}

/**
 * Page chrome for /learn/<portal> manual pages — wraps a `<TutorialShell>`
 * with the main-portal Navbar + Footer and a "Back to Learning Hub" link.
 * Keeps every per-portal tutorial behind the same chrome so the manual reads
 * as one document, not as scattered sub-portal pages.
 */
export function LearnPage(props: LearnPageProps) {
  const userQuery = useCurrentUser()
  const fullName = () => {
    const u = userQuery.data
    if (!u) return "—"
    return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email
  }
  const hasAccess = () => {
    const role = userQuery.data?.role
    return !!role && hasPortalAccess(role, props.portalKey)
  }

  createEffect(() => {
    if (typeof window === "undefined") return
    if (userQuery.data && !hasAccess()) {
      window.location.href = "/learn"
    }
  })

  return (
    <div class="min-h-screen bg-surface-muted flex flex-col">
      <Show when={!userQuery.isPending} fallback={<PageLoading />}>
        <Navbar
          userName={fullName()}
          userRole={userQuery.data?.role}
          userEmail={userQuery.data?.email}
          userPhotoUrl={userQuery.data?.photoUrl}
        />

        <main class="flex-1 px-6 sm:px-8 lg:px-12 py-8 sm:py-10">
          <div class="max-w-6xl mx-auto mt-6">
            <div class="mb-2">
              <BackLink href="/learn">Learning Hub</BackLink>
            </div>
            <Show when={hasAccess()} fallback={<NoManualAccess />}>
              <TutorialShell
                title={props.title}
                subtitle={props.subtitle}
                intro={props.intro}
                workflow={props.workflow}
                checklist={props.checklist}
                sections={props.sections}
              />
            </Show>
          </div>
        </main>

        <Footer />
      </Show>
    </div>
  )
}

function NoManualAccess() {
  return (
    <div class="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icons.lock class="h-6 w-6" />
      </div>
      <h1 class="mt-5 text-xl font-semibold text-foreground">No access to this manual</h1>
      <p class="mt-2 text-sm text-muted">
        This guide belongs to a portal your account cannot access.
      </p>
      <a
        href="/learn"
        class="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        Back to Learning Hub
      </a>
    </div>
  )
}
