import { Bell } from "lucide-solid"
import { createMemo, createSignal, createUniqueId, For, onCleanup, onMount, Show } from "solid-js"

/**
 * Minimal Notification shape — kept loose so this component does not depend
 * on `@ark/api-client`. Consumers (apps + sub-portals) wire the data + the
 * mutation callbacks to whatever backend they use.
 */
export interface NotificationItem {
  id: string
  title: string
  description?: string | null
  link?: string | null
  read: boolean
  createdAt: string
}

export interface NotificationBellProps {
  notifications: () => NotificationItem[]
  unreadCount: () => number
  isLoading?: () => boolean
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  desktopAlertsSupported?: () => boolean
  desktopAlertsEnabled?: () => boolean
  onEnableDesktopAlerts?: () => void
  /**
   * Called when the user activates a notification (click or Enter). The default
   * is to mark it read; consumers can additionally navigate to `notif.link` or
   * do whatever. If omitted, defaults to mark-read + (if link) `window.location.href = link`.
   */
  onSelect?: (notif: NotificationItem) => void
  /** href for the "View all notifications" footer link. Hidden if absent. */
  viewAllHref?: string
}

function defaultSelect(notif: NotificationItem) {
  if (typeof window === "undefined") return
  if (notif.link) window.location.href = notif.link
}

export function NotificationBell(props: NotificationBellProps) {
  const [open, setOpen] = createSignal(false)
  const panelId = createUniqueId()
  let containerRef: HTMLDivElement | undefined
  let triggerRef: HTMLButtonElement | undefined
  let panelRef: HTMLDivElement | undefined
  const sortedNotifications = createMemo(() =>
    [...props.notifications()].sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  )
  const unreadLabel = () => {
    const count = props.unreadCount()
    if (count === 0) return "All caught up"
    return `${count} unread`
  }

  function focusFirstPanelControl() {
    requestAnimationFrame(() => {
      panelRef?.querySelector<HTMLElement>("button:not([disabled]), a[href]")?.focus()
    })
  }

  function openPanel() {
    setOpen(true)
    focusFirstPanelControl()
  }

  function close(options: { restoreFocus?: boolean } = {}) {
    setOpen(false)
    if (options.restoreFocus) requestAnimationFrame(() => triggerRef?.focus())
  }

  function activate(notif: NotificationItem) {
    if (!notif.read) props.onMarkRead(notif.id)
    if (props.onSelect) props.onSelect(notif)
    else defaultSelect(notif)
    close()
  }

  function onTriggerKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      openPanel()
    }
  }

  function onPanelKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault()
      close({ restoreFocus: true })
      return
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return

    const controls = Array.from(
      panelRef?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]") ?? []
    )
    if (controls.length === 0) return
    e.preventDefault()
    const currentIndex = controls.indexOf(document.activeElement as HTMLElement)
    const direction = e.key === "ArrowDown" ? 1 : -1
    const nextIndex =
      currentIndex < 0 ? 0 : (currentIndex + direction + controls.length) % controls.length
    controls[nextIndex]?.focus()
  }

  onMount(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef && !containerRef.contains(e.target as Node)) close()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open()) close({ restoreFocus: true })
    }
    document.addEventListener("click", onClickOutside)
    document.addEventListener("keydown", onKeyDown)
    onCleanup(() => {
      document.removeEventListener("click", onClickOutside)
      document.removeEventListener("keydown", onKeyDown)
    })
  })

  return (
    <div ref={containerRef} class="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        onKeyDown={onTriggerKeyDown}
        aria-label={`Notifications (${props.unreadCount()} unread)`}
        aria-haspopup="dialog"
        aria-controls={panelId}
        aria-expanded={open()}
        class="relative w-10 h-10 rounded-lg hover:bg-surface-muted flex items-center justify-center transition-colors text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Bell class="w-5 h-5" />
        <Show when={props.unreadCount() > 0}>
          <span
            aria-hidden="true"
            class="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-accent text-white text-[10px] font-semibold rounded-full flex items-center justify-center"
          >
            {props.unreadCount() > 99 ? "99+" : props.unreadCount()}
          </span>
        </Show>
      </button>

      <Show when={open()}>
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="Notifications"
          onKeyDown={onPanelKeyDown}
          class="absolute right-0 top-full mt-2 w-[min(24rem,calc(100vw-2rem))] animate-fade-in bg-surface rounded-xl shadow-lg border border-border py-2 z-50"
        >
          <div class="px-4 py-3 border-b border-border flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-foreground">Notifications</p>
              <p class="text-xs text-muted mt-0.5">{unreadLabel()}</p>
            </div>
            <button
              type="button"
              onClick={() => props.onMarkAllRead()}
              disabled={props.unreadCount() === 0}
              class="rounded-md px-1.5 py-1 text-xs text-primary hover:underline disabled:text-muted disabled:no-underline disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Mark all read
            </button>
          </div>
          <Show when={props.desktopAlertsSupported?.() && !props.desktopAlertsEnabled?.()}>
            <div class="px-4 py-2 border-b border-border flex items-center justify-between gap-3">
              <span class="text-xs text-muted">Desktop alerts are off</span>
              <button
                type="button"
                onClick={() => props.onEnableDesktopAlerts?.()}
                class="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Enable
              </button>
            </div>
          </Show>
          <div class="max-h-80 overflow-y-auto">
            <Show
              when={sortedNotifications().length > 0}
              fallback={
                <p class="px-4 py-8 text-center text-sm text-muted">
                  {props.isLoading?.() ? "Loading…" : "No notifications yet."}
                </p>
              }
            >
              <For each={sortedNotifications()}>
                {notif => (
                  <button
                    type="button"
                    onClick={() => activate(notif)}
                    class={`w-full text-left flex gap-3 px-4 py-2.5 hover:bg-surface-muted border-l-2 transition-colors focus-visible:outline-none focus-visible:bg-surface-muted ${
                      notif.read ? "border-transparent" : "border-accent bg-accent/[0.02]"
                    }`}
                  >
                    <div
                      class="w-2 h-2 mt-2 flex-shrink-0 rounded-full bg-accent opacity-0 data-[unread=true]:opacity-100"
                      data-unread={!notif.read}
                    />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-3">
                        <p
                          class={`text-sm leading-5 ${notif.read ? "text-muted" : "text-foreground font-medium"}`}
                        >
                          {notif.title}
                        </p>
                        <p class="text-[11px] text-muted whitespace-nowrap pt-0.5">
                          {formatRelative(notif.createdAt)}
                        </p>
                      </div>
                      <Show when={notif.description}>
                        <p class="text-xs text-muted line-clamp-2 mt-0.5">{notif.description}</p>
                      </Show>
                    </div>
                  </button>
                )}
              </For>
            </Show>
          </div>
          <Show when={props.viewAllHref}>
            <div class="px-4 py-2 border-t border-border">
              <a
                href={props.viewAllHref}
                class="block rounded-md py-1 text-center text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                View all notifications
              </a>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  )
}

/** Lightweight relative-time formatter — keeps NotificationBell dep-free. */
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ""
  const seconds = Math.floor((Date.now() - then) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}
