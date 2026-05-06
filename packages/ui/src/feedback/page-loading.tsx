/**
 * Standard "Loading…" placeholder used for page-level + section-level
 * pending states. Shows a subtle dashed-circle SVG spinner above the label.
 *
 * No external dependency — pure CSS animation via Tailwind's `animate-spin`.
 * Spinner is intentionally subtle (stroke-dasharray, low opacity) to read as
 * "loading" without screaming for attention on every page load.
 */
export function PageLoading(props: { label?: string; class?: string }) {
  return (
    <div
      class={`flex-1 flex flex-col items-center justify-center gap-3 ${props.class ?? ""}`}
      aria-live="polite"
      aria-busy="true"
    >
      <svg
        class="w-6 h-6 animate-spin text-primary/70"
        viewBox="0 0 24 24"
        fill="none"
        role="img"
        aria-label="Loading"
      >
        <title>Loading</title>
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-dasharray="6 6"
        />
      </svg>
      <div class="text-sm text-muted">{props.label ?? "Loading…"}</div>
    </div>
  )
}
