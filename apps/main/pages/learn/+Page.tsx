import { useCurrentUser } from "@ark/api-client"
import { BackLink, Icons, PageLoading, PortalIcons } from "@ark/ui"
import { For, Show } from "solid-js"
import { Footer, Navbar } from "@/components"

interface LearningCard {
  title: string
  blurb: string
  icon: keyof typeof PortalIcons
  /** In-portal route — every manual lives under main so users stay in one tab. */
  href: string
  group: "Operations" | "Finance"
}

const cards: LearningCard[] = [
  {
    title: "Training",
    blurb: "Batches, students, venues, TESDA records.",
    icon: "batches",
    href: "/learn/training",
    group: "Operations",
  },
  {
    title: "Procurement",
    blurb: "Purchase Requests, Purchase Orders, approvals.",
    icon: "procurement",
    href: "/learn/procurement",
    group: "Operations",
  },
  {
    title: "Inventory",
    blurb: "Stock, receiving deliveries, movement log.",
    icon: "inventory",
    href: "/learn/inventory",
    group: "Operations",
  },
  {
    title: "Finance",
    blurb: "Banks, transfers, disbursements, P&L report.",
    icon: "finance",
    href: "/learn/finance",
    group: "Finance",
  },
  {
    title: "Billing",
    blurb: "TESDA student receivables and statements.",
    icon: "billing",
    href: "/learn/billing",
    group: "Finance",
  },
  {
    title: "HR & Payroll",
    blurb: "Trainers, attendance, payroll periods.",
    icon: "hr",
    href: "/learn/hr",
    group: "Finance",
  },
]

const groups = ["Operations", "Finance"] as const
const flow = ["Training", "Procurement", "Inventory", "Billing", "Finance", "HR"]

export default function LearnHubPage() {
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
            <div class="mb-4">
              <BackLink href="/">Dashboard</BackLink>
            </div>

            <div class="mb-8 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm">
              <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p class="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                    <Icons.helpCircle class="h-3.5 w-3.5" />
                    ERP guides
                  </p>
                  <h1 class="text-2xl sm:text-3xl font-semibold text-foreground">Learning Hub</h1>
                  <p class="text-sm text-muted mt-2 max-w-2xl leading-relaxed">
                    The full how-to manual for every Ark Institute portal. Start with the module you
                    use daily, or follow the operating flow from batch setup to reporting.
                  </p>
                </div>

                <div class="rounded-xl border border-border bg-surface-muted p-4">
                  <p class="text-xs font-semibold uppercase tracking-wider text-muted">ERP flow</p>
                  <ol class="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-foreground">
                    <For each={flow}>
                      {(step, index) => (
                        <li class="flex items-center gap-2">
                          <span class="rounded-full bg-primary/10 px-2 py-1 text-primary">
                            {step}
                          </span>
                          <Show when={index() < flow.length - 1}>
                            <Icons.arrowRight class="h-3.5 w-3.5 text-muted" />
                          </Show>
                        </li>
                      )}
                    </For>
                  </ol>
                </div>
              </div>
            </div>

            <div class="space-y-8">
              <For each={groups}>
                {group => (
                  <section>
                    <div class="mb-3 flex items-center justify-between">
                      <h2 class="text-sm font-semibold uppercase tracking-wider text-muted">
                        {group}
                      </h2>
                      <span class="text-xs text-muted">
                        {cards.filter(card => card.group === group).length} manuals
                      </span>
                    </div>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <For each={cards.filter(card => card.group === group)}>
                        {card => {
                          const Icon = PortalIcons[card.icon]
                          return (
                            <a
                              href={card.href}
                              class="group block rounded-xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                            >
                              <div class="mb-4 flex items-start justify-between">
                                <div class="rounded-lg bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
                                  <Icon class="h-6 w-6 text-primary" />
                                </div>
                                <Icons.arrowRight class="h-5 w-5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                              </div>

                              <h3 class="text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                                {card.title}
                              </h3>
                              <p class="mt-1.5 text-sm text-muted">{card.blurb}</p>
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
