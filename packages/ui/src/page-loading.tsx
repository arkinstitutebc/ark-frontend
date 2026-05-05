/**
 * Standard "Loading…" placeholder used for page-level + section-level
 * pending states. Replaces hand-rolled `animate-pulse` divs scattered
 * across apps.
 */
export function PageLoading(props: { label?: string; class?: string }) {
  return (
    <div
      class={`flex-1 flex items-center justify-center ${props.class ?? ""}`}
      aria-live="polite"
      aria-busy="true"
    >
      <div class="animate-pulse text-sm text-muted">{props.label ?? "Loading…"}</div>
    </div>
  )
}
