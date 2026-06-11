import { hasPortalAccess, type PortalKey, useCurrentUser } from "@ark/api-client"
import { BackLink, Icons, PageLoading, PortalIcons } from "@ark/ui"
import { createMemo, For, Show } from "solid-js"
import { Footer, Navbar } from "@/components"

interface LearningCard {
  key: PortalKey
  title: string
  blurb: string
  icon: keyof typeof PortalIcons
  /** In-portal route — every manual lives under main so users stay in one tab. */
  href: string
  group: "Operations" | "Finance"
}

const cards: LearningCard[] = [
  {
    key: "training",
    title: "Training",
    blurb: "Batches, schedules, students, documents, and TESDA training records.",
    icon: "batches",
    href: "/learn/training",
    group: "Operations",
  },
  {
    key: "procurement",
    title: "Procurement",
    blurb: "Purchase requests, petty cash, approvals, orders, and delivery handoff.",
    icon: "procurement",
    href: "/learn/procurement",
    group: "Operations",
  },
  {
    key: "inventory",
    title: "Inventory",
    blurb: "Stock items, receiving, cycle counts, adjustments, and movement history.",
    icon: "inventory",
    href: "/learn/inventory",
    group: "Operations",
  },
  {
    key: "finance",
    title: "Finance",
    blurb: "Banks, transfers, disbursements, assets, settings, and reports.",
    icon: "finance",
    href: "/learn/finance",
    group: "Finance",
  },
  {
    key: "billing",
    title: "Billing",
    blurb: "Receivables, payments, balances, and billing statements.",
    icon: "billing",
    href: "/learn/billing",
    group: "Finance",
  },
  {
    key: "hr",
    title: "HR & Payroll",
    blurb: "Trainer records, attendance, payroll periods, and payroll reports.",
    icon: "hr",
    href: "/learn/hr",
    group: "Finance",
  },
]

const groups = ["Operations", "Finance"] as const

export default function LearnHubPage() {
  const userQuery = useCurrentUser()
  const fullName = () => {
    const u = userQuery.data
    if (!u) return "—"
    return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email
  }
  const visibleCards = createMemo(() => {
    const role = userQuery.data?.role
    if (!role) return []
    return cards.filter(card => hasPortalAccess(role, card.key))
  })
  const visibleGroups = createMemo(() =>
    groups.filter(group => visibleCards().some(card => card.group === group))
  )
  const guideCount = createMemo(() => visibleCards().length)

  return (
    <div class="min-h-screen bg-surface-muted flex flex-col">
      <Show when={!userQuery.isPending} fallback={<PageLoading />}>
        <Navbar
          userName={fullName()}
          userRole={userQuery.data?.role}
          userEmail={userQuery.data?.email}
          userPhotoUrl={userQuery.data?.photoUrl}
        />

        <main class="flex-1 px-5 py-6 sm:px-8 sm:py-8 lg:px-12">
          <div class="mx-auto max-w-7xl">
            <div class="mb-5">
              <BackLink href="/">Dashboard</BackLink>
            </div>

            <header class="mb-8 border-b border-border pb-6">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div class="min-w-0">
                  <p class="mb-3 inline-flex items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
                    <Icons.helpCircle class="h-3.5 w-3.5" />
                    Learning Hub
                  </p>
                  <h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    ERP Manuals
                  </h1>
                  <p class="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
                    Clean operating guides for the portals available to your account. Pick the
                    module you are working in and keep the guide open while entering records.
                  </p>
                </div>

                <div class="grid grid-cols-2 gap-3 sm:min-w-72">
                  <div class="rounded-lg border border-border bg-surface px-4 py-3">
                    <p class="text-xs font-semibold uppercase tracking-wide text-muted">Manuals</p>
                    <p class="mt-1 text-2xl font-bold text-foreground">{guideCount()}</p>
                  </div>
                  <div class="rounded-lg border border-border bg-surface px-4 py-3">
                    <p class="text-xs font-semibold uppercase tracking-wide text-muted">Groups</p>
                    <p class="mt-1 text-2xl font-bold text-foreground">{visibleGroups().length}</p>
                  </div>
                </div>
              </div>
            </header>

            <div class="space-y-8">
              <For each={visibleGroups()}>
                {group => (
                  <section>
                    <div class="mb-3 flex items-center justify-between border-b border-border pb-2">
                      <h2 class="text-sm font-semibold uppercase tracking-wider text-muted">
                        {group}
                      </h2>
                      <span class="text-xs text-muted">
                        {visibleCards().filter(card => card.group === group).length} manuals
                      </span>
                    </div>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <For each={visibleCards().filter(card => card.group === group)}>
                        {card => {
                          const Icon = PortalIcons[card.icon]
                          return (
                            <a
                              href={card.href}
                              class="group flex min-h-44 flex-col rounded-lg border border-border bg-surface p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                            >
                              <div class="mb-4 flex items-start justify-between">
                                <div class="rounded-lg bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
                                  <Icon class="h-6 w-6 text-primary" />
                                </div>
                              </div>

                              <h3 class="text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                                {card.title}
                              </h3>
                              <p class="mt-1.5 flex-1 text-sm leading-relaxed text-muted">
                                {card.blurb}
                              </p>
                              <span class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                                Open manual
                                <Icons.arrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
                              </span>
                            </a>
                          )
                        }}
                      </For>
                    </div>
                  </section>
                )}
              </For>
            </div>
          </div>
        </main>

        <Footer />
      </Show>
    </div>
  )
}
