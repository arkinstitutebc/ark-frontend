import { createSignal, onCleanup, onMount } from "solid-js"
import { Footer, Navbar, PortalCards } from "@/components"

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = createSignal(new Date())
  let intervalId: ReturnType<typeof setInterval>

  const getGreeting = () => {
    const hour = currentTime().getHours()
    if (hour < 12) return { text: "Good Morning", emoji: "🌅" }
    if (hour < 17) return { text: "Good Afternoon", emoji: "☀️" }
    return { text: "Good Evening", emoji: "🌙" }
  }

  onMount(() => {
    intervalId = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
  })

  onCleanup(() => {
    clearInterval(intervalId)
  })

  return (
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <Navbar userName="Camille" userRole="Administrator" userEmail="camille@arkinstitutebc.com" />

      {/* Main Content */}
      <main class="flex-1 px-6 sm:px-8 lg:px-12 py-8 sm:py-10">
        <div class="max-w-6xl mx-auto mt-8">
          <div class="mb-8">
            <h2 class="text-xl sm:text-2xl text-gray-900 font-medium">
              {getGreeting().text}, Camille {getGreeting().emoji}
            </h2>
          </div>

          {/* Portal Cards */}
          <PortalCards userRole="admin" />
        </div>
      </main>

      <Footer />
    </div>
  )
}
