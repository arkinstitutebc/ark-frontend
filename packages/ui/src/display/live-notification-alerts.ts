import { createEffect, createSignal, onMount } from "solid-js"
import { toast } from "../feedback/app-toaster"
import type { NotificationItem } from "./notification-bell"

const DESKTOP_ENABLED_KEY = "ark-desktop-notifications-enabled"

export function useLiveNotificationAlerts(notifications: () => NotificationItem[]) {
  const [desktopSupported, setDesktopSupported] = createSignal(false)
  const [desktopEnabled, setDesktopEnabled] = createSignal(false)
  const seen = new Set<string>()
  let initialized = false
  let mounted = false

  onMount(() => {
    mounted = true
    setDesktopSupported("Notification" in window)
    setDesktopEnabled(
      localStorage.getItem(DESKTOP_ENABLED_KEY) === "true" &&
        "Notification" in window &&
        Notification.permission === "granted"
    )
  })

  createEffect(() => {
    if (!mounted) return
    const unread = notifications().filter(notif => !notif.read)

    if (!initialized) {
      for (const notif of unread) seen.add(notif.id)
      initialized = true
      return
    }

    const fresh = unread.filter(notif => !seen.has(notif.id))
    if (fresh.length === 0) return

    for (const notif of fresh) seen.add(notif.id)
    for (const notif of fresh.slice().reverse()) {
      showAlert(notif, desktopEnabled())
    }
  })

  async function requestDesktopAlerts() {
    if (!desktopSupported()) return
    const permission = await Notification.requestPermission()
    const enabled = permission === "granted"
    localStorage.setItem(DESKTOP_ENABLED_KEY, enabled ? "true" : "false")
    setDesktopEnabled(enabled)
    if (enabled) toast.success("Desktop alerts enabled")
    else toast.info("Desktop alerts are off")
  }

  return {
    desktopSupported,
    desktopEnabled,
    requestDesktopAlerts,
  }
}

function showAlert(notif: NotificationItem, desktopEnabled: boolean) {
  const message = notif.description ? `${notif.title}: ${notif.description}` : notif.title
  toast.info(message)

  if (!desktopEnabled || !("Notification" in window) || Notification.permission !== "granted") {
    return
  }

  const browserNotification = new Notification(notif.title, {
    body: notif.description ?? undefined,
    tag: notif.id,
  })

  browserNotification.onclick = () => {
    window.focus()
    if (notif.link) window.location.href = notif.link
    browserNotification.close()
  }
}
