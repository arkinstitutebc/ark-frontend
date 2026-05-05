import { createSignal, onCleanup, onMount } from "solid-js"
import { UI } from "./ui"

export function Footer() {
  const [currentTime, setCurrentTime] = createSignal(new Date())

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  let intervalId: ReturnType<typeof setInterval>

  onMount(() => {
    intervalId = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
  })

  onCleanup(() => {
    clearInterval(intervalId)
  })

  return (
    <footer class="bg-surface-muted border-t border-border mt-auto">
      <div class="px-6 sm:px-8 lg:px-12 py-6">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <img
              src="/logo/ark-transpa.png"
              alt="Ark Institute"
              width="28"
              height="28"
              class="object-contain opacity-60"
            />
            <p class="text-sm text-muted">© 2025 Ark Institute. All rights reserved.</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 bg-surface/80 px-4 py-2 rounded-full border border-border shadow-sm">
              <UI.calendar class="w-4 h-4 text-primary" />
              <p class="text-sm text-foreground">{formatDate(currentTime())}</p>
            </div>
            <div class="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/10 shadow-sm">
              <UI.clock class="w-4 h-4 text-primary" />
              <p class="text-sm font-mono font-semibold text-primary">
                {formatTime(currentTime())}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
