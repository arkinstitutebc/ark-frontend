import { useCurrentUser } from "@ark/api-client"
import { Icons, PageLoading } from "@ark/ui"
import { type Component, createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { Footer, Navbar, PortalCards, ResourceDock } from "@/components"

interface TrainerAction {
  title: string
  description: string
  href: string
  Icon: Component<{ class?: string }>
  accent: "blue" | "green" | "amber" | "slate"
}

const trainerActions: TrainerAction[] = [
  {
    title: "Training",
    description: "Open batches, student records, venues, and TESDA training records.",
    href: import.meta.env.VITE_TRAINING_PORTAL_URL || "https://training.arkinstitutebc.com",
    Icon: Icons.graduationCap,
    accent: "blue",
  },
  {
    title: "Procurement",
    description: "Create and track purchase requests for class and training needs.",
    href: import.meta.env.VITE_PROCUREMENT_PORTAL_URL || "https://procurement.arkinstitutebc.com",
    Icon: Icons.shoppingBag,
    accent: "amber",
  },
  {
    title: "Inventory",
    description: "View stock, received items, and available training materials.",
    href: import.meta.env.VITE_INVENTORY_PORTAL_URL || "https://inventory.arkinstitutebc.com",
    Icon: Icons.package,
    accent: "green",
  },
  {
    title: "Learning Hub",
    description: "Read the role-specific guides for the portals available to your account.",
    href: "/learn",
    Icon: Icons.helpCircle,
    accent: "slate",
  },
]

export default function DashboardPage() {
  const userQuery = useCurrentUser()
  const [currentTime, setCurrentTime] = createSignal(new Date())
  let intervalId: ReturnType<typeof setInterval>

  // Auth gate: not logged in → /login. Must change password → /profile.
  createEffect(() => {
    if (typeof window === "undefined") return
    if (userQuery.isError) {
      window.location.href = "/login"
      return
    }
    if (userQuery.data?.mustChangePassword) {
      window.location.href = "/profile?required=1"
    }
  })

  const getGreeting = () => {
    const hour = currentTime().getHours()
    if (hour < 12) return { text: "Good Morning", Icon: Icons.sunrise }
    if (hour < 17) return { text: "Good Afternoon", Icon: Icons.sun }
    return { text: "Good Evening", Icon: Icons.moon }
  }

  const firstName = () => userQuery.data?.firstName ?? "—"
  const fullName = () => {
    const u = userQuery.data
    if (!u) return "—"
    return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email
  }
  const role = () => userQuery.data?.role ?? "—"
  const email = () => userQuery.data?.email ?? "—"
  const userRole = (): "admin" | "director" | "trainer" => {
    const r = userQuery.data?.role
    if (r === "admin" || r === "director" || r === "trainer") return r
    return "trainer"
  }

  onMount(() => {
    intervalId = setInterval(() => setCurrentTime(new Date()), 1000)
  })
  onCleanup(() => clearInterval(intervalId))

  return (
    <div class="min-h-screen bg-surface-muted flex flex-col">
      <Show when={!userQuery.isPending} fallback={<PageLoading />}>
        <Navbar
          userName={fullName()}
          userRole={role()}
          userEmail={email()}
          userPhotoUrl={userQuery.data?.photoUrl}
        />

        <main class="flex-1 px-6 sm:px-8 lg:px-12 py-8 sm:py-10">
          <div class="relative max-w-6xl mx-auto mt-8">
            <div class="mb-8">
              <h2 class="text-xl sm:text-2xl text-foreground font-medium flex items-center gap-2">
                <span>
                  {getGreeting().text}, {firstName()}
                </span>
                {(() => {
                  const { Icon } = getGreeting()
                  return <Icon class="w-6 h-6 text-primary" />
                })()}
              </h2>
            </div>

            <Show
              when={userRole() === "trainer"}
              fallback={
                <>
                  <PortalCards userRole={userRole()} />
                  <ResourceDock userRole={userRole()} />
                </>
              }
            >
              <TrainerWorkspace firstName={firstName()} />
            </Show>
          </div>
        </main>

        <Footer />
      </Show>
    </div>
  )
}

function TrainerWorkspace(props: { firstName: string }) {
  return (
    <div class="space-y-6">
      <section class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div class="grid gap-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div class="p-6 sm:p-7">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                Trainer
              </span>
              <span class="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
                Training workspace
              </span>
            </div>
            <h1 class="mt-5 max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Focused tools for classes, requests, stock, and guides.
            </h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Your dashboard is limited to the operational portals trainers use day to day. Finance,
              billing, HR, and admin tools stay hidden from this role.
            </p>
          </div>

          <div class="border-t border-border bg-surface-muted p-6 lg:border-l lg:border-t-0">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted">Access boundary</p>
            <div class="mt-4 space-y-3">
              <AccessLine label="Can open" value="Training, PRs, Inventory, Learning Hub" />
              <AccessLine label="Hidden" value="Finance, Billing, HR, Admin" />
              <AccessLine label="Password" value="Managed by admin reset flow" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <div class="mb-3 flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-foreground">Start here</h2>
            <p class="mt-0.5 text-sm text-muted">Choose the workspace you need right now.</p>
          </div>
          <span class="hidden rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted ring-1 ring-border sm:inline-flex">
            {props.firstName}'s access
          </span>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <For each={trainerActions}>{action => <TrainerActionCard action={action} />}</For>
        </div>
      </section>
    </div>
  )
}

function TrainerActionCard(props: { action: TrainerAction }) {
  const accentClass = () => {
    if (props.action.accent === "green") return "bg-green-50 text-green-700 ring-green-100"
    if (props.action.accent === "amber") return "bg-amber-50 text-amber-700 ring-amber-100"
    if (props.action.accent === "slate") return "bg-surface-muted text-primary ring-border"
    return "bg-primary/10 text-primary ring-primary/10"
  }

  return (
    <a
      href={props.action.href}
      class="group flex min-h-[13.5rem] flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <span class={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${accentClass()}`}>
        <props.action.Icon class="h-6 w-6" />
      </span>
      <h3 class="mt-5 text-lg font-semibold text-foreground group-hover:text-primary">
        {props.action.title}
      </h3>
      <p class="mt-2 flex-1 text-sm leading-6 text-muted">{props.action.description}</p>
      <span class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
        Open
        <Icons.arrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </a>
  )
}

function AccessLine(props: { label: string; value: string }) {
  return (
    <div>
      <p class="text-[11px] font-semibold uppercase tracking-wide text-muted">{props.label}</p>
      <p class="mt-0.5 text-sm font-medium text-foreground">{props.value}</p>
    </div>
  )
}
