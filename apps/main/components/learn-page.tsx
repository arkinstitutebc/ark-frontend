import { useCurrentUser } from "@ark/api-client"
import { BackLink, PageLoading, type TutorialSection, TutorialShell } from "@ark/ui"
import { type JSX, Show } from "solid-js"
import { Footer, Navbar } from "@/components"

export interface LearnPageProps {
  title: string
  subtitle?: string
  intro?: JSX.Element
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
            <TutorialShell
              title={props.title}
              subtitle={props.subtitle}
              intro={props.intro}
              sections={props.sections}
            />
          </div>
        </main>

        <Footer />
      </Show>
    </div>
  )
}
