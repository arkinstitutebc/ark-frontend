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
}

const cards: LearningCard[] = [
  {
    title: "Training",
    blurb: "Batches, students, venues, TESDA records.",
    icon: "batches",
    href: "/learn/training",
  },
  {
    title: "Procurement",
    blurb: "Purchase Requests, Purchase Orders, approvals.",
    icon: "procurement",
    href: "/learn/procurement",
  },
  {
    title: "Inventory",
    blurb: "Stock, receiving deliveries, movement log.",
    icon: "inventory",
    href: "/learn/inventory",
  },
  {
    title: "Finance",
    blurb: "Banks, transfers, disbursements, P&L report.",
    icon: "finance",
    href: "/learn/finance",
  },
  {
    title: "Billing",
    blurb: "TESDA student receivables and statements.",
    icon: "billing",
    href: "/learn/billing",
  },
  {
    title: "HR & Payroll",
    blurb: "Trainers, attendance, payroll periods.",
    icon: "hr",
    href: "/learn/hr",
  },
]

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

            <div class="mb-8">
              <h1 class="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-3">
                <Icons.helpCircle class="w-7 h-7 text-primary" /> Learning Hub
              </h1>
              <p class="text-sm text-muted mt-2 max-w-2xl">
                The full how-to manual for every Ark Institute portal — read here without leaving
                the main hub.
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <For each={cards}>
                {card => {
                  const Icon = PortalIcons[card.icon]
                  return (
                    <a
                      href={card.href}
                      class="group block bg-surface rounded-2xl shadow-sm p-6 border border-border hover:shadow-md hover:border-primary/30 transition-all"
                    >
                      <div class="flex items-start justify-between mb-5">
                        <div class="p-3.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                          <Icon class="w-7 h-7 text-primary" />
                        </div>
                        <Icons.helpCircle class="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
                      </div>

                      <h3 class="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {card.title}
                      </h3>
                      <p class="text-sm text-muted mt-1.5">{card.blurb}</p>

                      <div class="flex items-center gap-2 mt-5 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                        <span>Read manual</span>
                        <Icons.arrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </a>
                  )
                }}
              </For>
            </div>
          </div>
        </main>

        <Footer />
      </Show>
    </div>
  )
}
