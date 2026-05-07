import type { JSX } from "solid-js"
import { Show } from "solid-js"

interface PageHeaderProps {
  title: string
  /** Subtitle / count line under the title (e.g. "12 students"). */
  subtitle?: string | JSX.Element
  /** Optional right-side slot for primary action (button, link, etc.). */
  action?: JSX.Element
}

/**
 * Top-of-page header: large title + optional subtitle, with an action slot
 * (typically a "+ Add" button) on the right. Deduplicates the same block
 * from 30+ pages across all 7 portals.
 */
export function PageHeader(props: PageHeaderProps) {
  return (
    <div class="flex items-center justify-between mb-8 gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold text-foreground">{props.title}</h1>
        <Show when={props.subtitle}>
          <p class="text-sm text-muted mt-1">{props.subtitle}</p>
        </Show>
      </div>
      <Show when={props.action}>
        <div class="flex-shrink-0">{props.action}</div>
      </Show>
    </div>
  )
}
