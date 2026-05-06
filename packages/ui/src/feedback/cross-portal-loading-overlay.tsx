import { createSignal, onCleanup, onMount, Show } from "solid-js"
import { PageLoading } from "./page-loading"

const PORTAL_DOMAIN = ".arkinstitutebc.com"

function isPortalFamily(host: string): boolean {
  if (host.endsWith(PORTAL_DOMAIN)) return true
  if (host === "arkinstitutebc.com") return true
  if (host === "localhost") return true
  if (host.startsWith("127.0.0.1")) return true
  return false
}

/**
 * Fullscreen overlay that fires the instant the user clicks an anchor
 * pointing at a sibling portal (different subdomain on arkinstitutebc.com).
 *
 * Each portal is a separate origin, so cross-portal navigation is a real
 * full-page browser hop. Without instant feedback the user sees a blank
 * white screen during the unload→load gap. Mount this once per app inside
 * `+Layout.tsx` to render a `<PageLoading />` the moment the click happens
 * (event delegation, no per-link wiring needed).
 *
 * Stays visible until the source page unloads. The destination's own
 * loading state (AuthGate / PageLoading on the index page) takes over once
 * it hydrates, so the transition feels seamless in both directions.
 *
 * Skips:
 *   - same-origin navigation (Vike client router handles, TopProgressBar shows)
 *   - non-portal-family hosts (real external links — let the browser handle)
 *   - modifier-clicks / middle-click / target=_blank / download / preventDefault
 *   - in-page anchors, mailto:, tel:, javascript:
 */
export function CrossPortalLoadingOverlay() {
  const [navigating, setNavigating] = createSignal(false)

  onMount(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return
      if (e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as HTMLElement | null)?.closest("a[href]") as HTMLAnchorElement | null
      if (!a) return
      if (a.target && a.target !== "" && a.target !== "_self") return
      if (a.hasAttribute("download")) return
      const href = a.getAttribute("href") ?? ""
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      )
        return
      let url: URL
      try {
        url = new URL(href, window.location.href)
      } catch {
        return
      }
      if (url.origin === window.location.origin) return
      if (!isPortalFamily(url.hostname)) return
      setNavigating(true)
    }

    // bfcache restore (back button) re-shows the source page; clear overlay
    // so it's not stuck visible after an aborted nav.
    const onPageShow = () => setNavigating(false)

    document.addEventListener("click", onClick, { capture: true })
    window.addEventListener("pageshow", onPageShow)
    onCleanup(() => {
      document.removeEventListener("click", onClick, { capture: true })
      window.removeEventListener("pageshow", onPageShow)
    })
  })

  return (
    <Show when={navigating()}>
      <div
        class="fixed inset-0 z-[100] flex items-center justify-center bg-surface"
        aria-live="polite"
        aria-busy="true"
      >
        <PageLoading />
      </div>
    </Show>
  )
}
