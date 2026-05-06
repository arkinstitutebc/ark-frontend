import { createSignal, onCleanup, onMount, Show } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"

/**
 * Indeterminate progress bar pinned to the top of the viewport.
 * Animates 0% → 80% on navigation start, completes to 100% + fades on end.
 *
 * Detects navigation by watching `pageContext.urlPathname` changes (Vike
 * client-side router updates this synchronously when navigation begins).
 * No external dependency.
 */
export function TopProgressBar() {
  const ctx = usePageContext()
  const [progress, setProgress] = createSignal(0)
  const [visible, setVisible] = createSignal(false)
  let lastPath = ""
  let creepTimer: ReturnType<typeof setInterval> | undefined
  let hideTimer: ReturnType<typeof setTimeout> | undefined

  function start() {
    if (creepTimer) clearInterval(creepTimer)
    if (hideTimer) clearTimeout(hideTimer)
    setVisible(true)
    setProgress(8)
    // Creep upward toward 80% asymptotically while loading
    creepTimer = setInterval(() => {
      setProgress(p => (p < 80 ? p + (80 - p) * 0.15 : p))
    }, 200)
  }

  function done() {
    if (creepTimer) clearInterval(creepTimer)
    setProgress(100)
    hideTimer = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 250)
  }

  onMount(() => {
    lastPath = ctx.urlPathname
    // Patch the document click handler to start the bar early on link clicks.
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest(
        "a[href]"
      ) as HTMLAnchorElement | null
      if (!target) return
      if (target.target === "_blank") return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const href = target.getAttribute("href") ?? ""
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return
      // External link → browser handles, no bar
      try {
        const url = new URL(href, window.location.href)
        if (url.origin !== window.location.origin) return
        if (url.pathname === window.location.pathname) return
      } catch {
        return
      }
      start()
    }
    document.addEventListener("click", onClick, { capture: true })

    // When pageContext.urlPathname changes (Vike completed a navigation), finish.
    const checker = setInterval(() => {
      if (ctx.urlPathname !== lastPath) {
        lastPath = ctx.urlPathname
        done()
      }
    }, 100)

    onCleanup(() => {
      document.removeEventListener("click", onClick, { capture: true })
      clearInterval(checker)
      if (creepTimer) clearInterval(creepTimer)
      if (hideTimer) clearTimeout(hideTimer)
    })
  })

  return (
    <Show when={visible()}>
      <div class="fixed top-0 left-0 right-0 h-0.5 z-[60] pointer-events-none" aria-hidden="true">
        <div
          class="h-full bg-primary transition-[width,opacity] duration-200 ease-out"
          style={{
            width: `${progress()}%`,
            opacity: progress() >= 100 ? 0 : 1,
            "box-shadow": "0 0 8px rgba(25, 58, 122, 0.6)",
          }}
        />
      </div>
    </Show>
  )
}
