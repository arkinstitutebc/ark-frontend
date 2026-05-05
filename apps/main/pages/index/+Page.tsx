import { useCurrentUser } from "@ark/api-client"
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
    if (hour < 12) return { text: "Good Morning", emoji: "🌅" }
    if (hour < 17) return { text: "Good Afternoon", emoji: "☀️" }
    return { text: "Good Evening", emoji: "🌙" }
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
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <Show
        when={!userQuery.isPending}
        fallback={
          <div class="flex-1 flex items-center justify-center">
            <div class="animate-pulse text-sm text-gray-500">Loading…</div>
          </div>
        }
      >
        <Navbar userName={fullName()} userRole={role()} userEmail={email()} />

        <main class="flex-1 px-6 sm:px-8 lg:px-12 py-8 sm:py-10">
          <div class="max-w-6xl mx-auto mt-8">
            <div class="mb-8">
              <h2 class="text-xl sm:text-2xl text-gray-900 font-medium">
                {getGreeting().text}, {firstName()} {getGreeting().emoji}
              </h2>
            </div>

            <PortalCards userRole={userRole()} />
          </div>
        </main>

        <Footer />
      </Show>
    </div>
  )
}
