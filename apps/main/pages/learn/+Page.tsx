import { useCurrentUser } from "@ark/api-client"
import { Icons, PageLoading, PortalIcons } from "@ark/ui"
import { For, Show } from "solid-js"
import { Footer, Navbar } from "@/components"

interface LearningCard {
  title: string
  blurb: string
  icon: keyof typeof PortalIcons
  /** Base portal URL — we link to {url}/tutorials. */
  baseUrlEnvKey:
    | "VITE_TRAINING_PORTAL_URL"
    | "VITE_PROCUREMENT_PORTAL_URL"
    | "VITE_INVENTORY_PORTAL_URL"
    | "VITE_FINANCE_PORTAL_URL"
    | "VITE_HR_PORTAL_URL"
    | "VITE_BILLING_PORTAL_URL"
  fallback: string
}

const cards: LearningCard[] = [
  {
    title: "Training",
    blurb: "Batches, students, venues, TESDA records.",
    icon: "batches",
    baseUrlEnvKey: "VITE_TRAINING_PORTAL_URL",
    fallback: "https://training.arkinstitutebc.com",
  },
  {
    title: "Procurement",
    blurb: "Purchase Requests, Purchase Orders, approvals.",
    icon: "procurement",
    baseUrlEnvKey: "VITE_PROCUREMENT_PORTAL_URL",
    fallback: "https://procurement.arkinstitutebc.com",
  },
  {
    title: "Inventory",
    blurb: "Stock, receiving deliveries, movement log.",
    icon: "inventory",
    baseUrlEnvKey: "VITE_INVENTORY_PORTAL_URL",
    fallback: "https://inventory.arkinstitutebc.com",
  },
  {
    title: "Finance",
    blurb: "Banks, transfers, disbursements, P&L report.",
    icon: "finance",
    baseUrlEnvKey: "VITE_FINANCE_PORTAL_URL",
    fallback: "https://finance.arkinstitutebc.com",
  },
  {
    title: "Billing",
    blurb: "TESDA student receivables and statements.",
    icon: "billing",
    baseUrlEnvKey: "VITE_BILLING_PORTAL_URL",
    fallback: "https://billing.arkinstitutebc.com",
  },
  {
    title: "HR & Payroll",
    blurb: "Trainers, attendance, payroll periods.",
    icon: "hr",
    baseUrlEnvKey: "VITE_HR_PORTAL_URL",
    fallback: "https://hr.arkinstitutebc.com",
  },
]

function tutorialUrl(card: LearningCard) {
  const base = (import.meta.env[card.baseUrlEnvKey] as string | undefined) ?? card.fallback
  return `${base.replace(/\/$/, "")}/tutorials`
}

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
            <a
              href="/"
              class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary mb-4"
            >
              <Icons.arrowLeft class="w-4 h-4" /> Dashboard
            </a>

            <div class="mb-8">
              <h1 class="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-3">
                <Icons.helpCircle class="w-7 h-7 text-primary" /> Learning Hub
              </h1>
              <p class="text-sm text-muted mt-2 max-w-2xl">
                Step-by-step guides for every portal — open the one you want to learn, then come
                back here when you need another.
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <For each={cards}>
                {card => {
                  const Icon = PortalIcons[card.icon]
                  return (
                    <a
                      href={tutorialUrl(card)}
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
                        <span>Open guide</span>
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
