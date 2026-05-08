import { useCurrentUser } from "@ark/api-client"
import { Icons, PageLoading } from "@ark/ui"
import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js"
import { Footer, Navbar, PortalCards } from "@/components"

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
          <div class="max-w-6xl mx-auto mt-8">
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

            <PortalCards userRole={userRole()} />

            <div class="mt-10">
              <h3 class="text-sm font-semibold text-muted uppercase tracking-wide mb-4">
                Resources
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Show when={userRole() === "admin"}>
                  <a
                    href="/admin/users"
                    class="group block bg-surface rounded-2xl shadow-lg p-6 border border-border hover:shadow-xl hover:border-primary/30 transition-all"
                  >
                    <div class="flex items-start justify-between mb-5">
                      <div class="p-4 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                        <Icons.users class="w-8 h-8 text-primary" />
                      </div>
                      <span class="px-3 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full">
                        Admin
                      </span>
                    </div>
                    <h3 class="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                      User Management
                    </h3>
                    <p class="text-sm text-muted mt-1.5">
                      Invite, edit, deactivate, and reset passwords for portal users.
                    </p>
                    <div class="flex items-center gap-2 mt-5 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                      <span>Manage users</span>
                      <Icons.arrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </a>
                </Show>

                <a
                  href="/learn"
                  class="group block bg-surface rounded-2xl shadow-lg p-6 border border-border hover:shadow-xl hover:border-primary/30 transition-all"
                >
                  <div class="flex items-start justify-between mb-5">
                    <div class="p-4 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                      <Icons.helpCircle class="w-8 h-8 text-primary" />
                    </div>
                    <span class="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                      Guides
                    </span>
                  </div>
                  <h3 class="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    Learning Hub
                  </h3>
                  <p class="text-sm text-muted mt-1.5">
                    How-to guides for every portal — Training, Procurement, Inventory, Finance,
                    Billing, HR.
                  </p>
                  <div class="flex items-center gap-2 mt-5 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                    <span>Open guides</span>
                    <Icons.arrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </a>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </Show>
    </div>
  )
}
