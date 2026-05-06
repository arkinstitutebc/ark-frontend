import { For } from "solid-js"

/**
 * Animated skeleton placeholder for tables fetching their first page.
 * Renders a muted grid of pulsing bars matching a typical table layout
 * (header row + N body rows × C columns).
 *
 * Use as the `fallback` of a `<Show when={!query.isPending}>` (or directly
 * inside a `<QueryBoundary>` skeleton slot) so the eye stays on the same
 * region of the screen while data loads.
 */
export function TableSkeleton(props: { rows?: number; cols?: number; class?: string }) {
  const rows = () => props.rows ?? 5
  const cols = () => props.cols ?? 4
  return (
    <div class={`w-full ${props.class ?? ""}`} aria-live="polite" aria-busy="true" role="status">
      <span class="sr-only">Loading data…</span>
      <div class="bg-surface-muted px-5 py-3 border-b border-border">
        <div class="grid gap-4" style={{ "grid-template-columns": `repeat(${cols()}, 1fr)` }}>
          <For each={Array.from({ length: cols() })}>
            {() => <div class="h-3 bg-border rounded animate-pulse" />}
          </For>
        </div>
      </div>
      <div class="divide-y divide-border">
        <For each={Array.from({ length: rows() })}>
          {() => (
            <div class="px-5 py-4">
              <div
                class="grid gap-4 items-center"
                style={{ "grid-template-columns": `repeat(${cols()}, 1fr)` }}
              >
                <For each={Array.from({ length: cols() })}>
                  {(_, i) => (
                    <div
                      class="h-3 bg-surface-muted rounded animate-pulse"
                      style={{ width: `${60 + ((i() * 13) % 35)}%` }}
                    />
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
